import { SceneController } from './SceneController';
import { UIController } from './UIController';
import { VSCodeContext } from './VSCodeContext';

/* global acquireVsCodeApi */
class MainApplication
{
  constructor()
  {
    this.ui_controller = new UIController(this);
    this.scene_controller = new SceneController(this);

    if (typeof acquireVsCodeApi === 'undefined')
    {
      // Fallback for testing
      window.acquireVsCodeApi = () =>
      {
        return {
          postMessage: (message) =>
          {
            console.log('Post message (fallback):', message);
            parent.postMessage(message, '*');
          }
        };
      };
    }

    VSCodeContext.ctx = acquireVsCodeApi();
  }

  init()
  {
    this.ui_controller.init(this.scene_controller);
    this.scene_controller.init(this.ui_controller);

    this._chunked_transfers = new Map();

    // Listen for messages from the extension
    window.addEventListener('message', event =>
    {
      const message = event.data;
      switch (message.type)
      {
      case 'loadModelFromUri':
        this.ui_controller.panel.contents.info.update_extension(message.extension || message.dataUri);
        this.scene_controller.loadModelFromUri(message.dataUri, message.fileSize);
        break;
      case 'loadModelFromBinary':
        this.ui_controller.panel.contents.info.update_extension(message.extension);
        this.scene_controller.loadModelFromBinary(message.data, message.extension, message.fileSize);
        break;
      case 'loadModelFromFiles':
        this.ui_controller.panel.contents.info.update_extension(message.extension);
        this.scene_controller.loadModelFromFiles(message.files, message.entryFileName, message.fileSize);
        break;
      case 'loadModelFromBase64':
        this.ui_controller.panel.contents.info.update_extension(message.extension);
        this.scene_controller.loadModelFromBase64(message.data, message.extension, message.fileSize);
        break;
      case 'modelChunkStart':
        this._chunked_transfers.set(message.transferId, {
          extension: message.extension,
          fileSize: message.fileSize,
          totalChunks: message.totalChunks,
          received: 0,
          chunks: new Array(message.totalChunks)
        });
        break;
      case 'modelChunk':
      {
        const transfer = this._chunked_transfers.get(message.transferId);
        if (!transfer) break;
        // message.data is a Uint8Array (structured-cloned). Store as-is.
        transfer.chunks[message.index] = message.data;
        transfer.received += 1;
        if (transfer.received === transfer.totalChunks)
        {
          this._chunked_transfers.delete(message.transferId);
          const total_bytes = transfer.chunks.reduce((sum, c) => sum + c.byteLength, 0);
          const merged = new Uint8Array(total_bytes);
          let offset = 0;
          for (let i = 0; i < transfer.chunks.length; i++)
          {
            merged.set(transfer.chunks[i], offset);
            offset += transfer.chunks[i].byteLength;
          }
          this.ui_controller.panel.contents.info.update_extension(transfer.extension);
          this.scene_controller.loadModelFromBinary(merged.buffer, transfer.extension || 'glb', transfer.fileSize);
        }
        break;
      }
      case 'setWebViewPath':
        this.scene_controller.setLibURIs(message.webview_path);
        break;
      case 'updateLanguage':
        this.ui_controller.set_language(message.language);
        break;
      }
    });

    VSCodeContext.ctx.postMessage({ type: 'ready' });
  }
}

document.addEventListener('DOMContentLoaded', () =>
{
  console.log('WebView loaded!');

  const main_application = new MainApplication();
  main_application.init();

  window.__glbViewerSetLanguage = (language) =>
  {
    main_application.ui_controller.set_language(language);
  };
});
