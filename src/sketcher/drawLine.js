import * as THREE from '../../node_modules/three/src/Three';
import {ptObj, lineObj} from '../utils/shared'

export function drawLine(mouseLoc) {

  const p1 = ptObj()
  
  p1.matrixAutoUpdate = false;
  p1.userData.constraints = []

  const p2 = ptObj()
  p2.matrixAutoUpdate = false;
  p2.userData.constraints = []

  const line = lineObj()
  line.matrixAutoUpdate = false;
  line.frustumCulled = false;
  line.userData.constraints = []


  line.geometry.attributes.position.set(mouseLoc)
  p1.geometry.attributes.position.set(mouseLoc)

  if (this.subsequent) {

    this.constraints.set(++this.c_id,  //??? why incremennt before not after
      [
        'points_coincident', -1,
        [this.obj3d.children[this.obj3d.children.length - 2].name, p1.name, -1, -1]
      ]
    )

    p1.userData.constraints.push(this.c_id)
    this.obj3d.children[this.obj3d.children.length - 2].userData.constraints.push(this.c_id)

  }



  return [p1, p2, line];
}

export function drawLine2(mouseLoc, toPush) {

  const [p1, p2, line] = toPush

  p2.geometry.attributes.position.set(mouseLoc);
  p2.geometry.attributes.position.needsUpdate = true;
  p2.geometry.computeBoundingSphere();

  line.geometry.attributes.position.set(mouseLoc, 3)
  line.geometry.attributes.position.needsUpdate = true;
}