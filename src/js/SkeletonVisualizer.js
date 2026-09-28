import { ConeGeometry, Mesh, MeshBasicMaterial, Object3D, SphereGeometry, Vector3 } from 'three';

export class SkeletonVisualizer extends Object3D
{
  constructor()
  {
    super();
    this.bones = [];
    this.bones_mesh_dic = new Map();
  }

  init_from_scene(scene)
  {
    this.reset();
    if (!scene) return;
    this.collect_bones(scene);

    for (let i = 0; i < this.bones.length; i++)
    {
      const bone = this.bones[i];
      let mesh = undefined;
      if (bone.children.length > 0)
      {
        const cone = new Mesh(new ConeGeometry(0.005, 1), new MeshBasicMaterial({ color: '#3956A0' }));
        cone.geometry.rotateX(Math.PI / 2);
        cone.geometry.translate(0, 0, 0.5);
        bone.getWorldPosition(cone.position);
        bone.getWorldQuaternion(cone.quaternion);
        const next_child_pos = new Vector3().copy(cone.position);
        bone.children[0].getWorldPosition(next_child_pos);
        const dir = next_child_pos.clone().sub(cone.position).normalize();
        cone.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), dir);
        cone.scale.z = cone.position.distanceTo(next_child_pos);
        this.add(cone);
        mesh = cone;
      }
      else
      {
        const endpoint = new Mesh(new SphereGeometry(0.005), new MeshBasicMaterial({ color: '#3988A0' }));
        bone.getWorldPosition(endpoint.position);
        this.add(endpoint);
        mesh = endpoint;
      }
      this.bones_mesh_dic.set(bone, mesh);
    }
  }

  reset()
  {
    for (const helper of this.children)
    {
      helper.geometry.dispose();
      helper.material.dispose();
    }
    this.clear();
    this.bones = [];
    this.bones_mesh_dic.clear();
  }

  collect_bones(scene)
  {
    scene.traverse(child =>
    {
      if (child.isBone)
      {
        this.bones.push(child);
      }
    });
  }

  hide_all()
  {
    for (let i = 0; i < this.bones.length; i++)
    {
      this.bones_mesh_dic.get(this.bones[i]).visible = false;
    }
  }

  show_bone_hierarchy(bone)
  {
    bone.traverse(child =>
    {
      const helper = this.bones_mesh_dic.get(child);
      if (helper) helper.visible = true;
    });
  }

  update()
  {
    for (let i = 0; i < this.bones.length; i++)
    {
      const bone = this.bones[i];
      const mesh = this.bones_mesh_dic.get(bone);

      if (bone.children.length > 0)
      {
        bone.getWorldPosition(mesh.position);
        bone.getWorldQuaternion(mesh.quaternion);
        const next_child_pos = new Vector3().copy(mesh.position);
        bone.children[0].getWorldPosition(next_child_pos);
        const dir = next_child_pos.clone().sub(mesh.position).normalize();
        mesh.quaternion.setFromUnitVectors(new Vector3(0, 0, 1), dir);
        mesh.scale.z = mesh.position.distanceTo(next_child_pos);
      }
      else
      {
        bone.getWorldPosition(mesh.position);
      }
    }
  }
}
