

import React, { useEffect, useReducer } from 'react';

import { useDispatch, useSelector } from 'react-redux'

import { FaCube, FaEdit } from 'react-icons/fa'
import { BsBoxArrowUp} from 'react-icons/bs'
import { MdDone, MdSave, MdFolder} from 'react-icons/md'
import * as Icon from "./icons";



export const NavBar = () => {
  const dispatch = useDispatch()
  const treeEntries = useSelector(state => state.treeEntries)
  const activeSketchId = useSelector(state => state.treeEntries.activeSketchId)


  const boolOp = (code) => {
    if (sc.selected.length != 2 || !sc.selected.every(e => e.userData.type == 'mesh')) return
    const [m1, m2] = sc.selected
    const mesh = sc.subtract(m1, m2, code)
    dispatch({ type: 'rx-boolean', mesh, deps: [m1.name, m2.name] })
    sc.render()
    forceUpdate()
  }
  const extrude = () => {
    console.log(treeEntries.tree[activeSketchId])
    sc.extrude(treeEntries.byId[activeSketchId])
  }

  useEffect(() => {
    if (!activeSketchId) {
      sc.canvas.addEventListener('pointermove', sc.onHover)
      sc.canvas.addEventListener('pointerdown', sc.onPick)
      return () => {
        sc.canvas.removeEventListener('pointermove', sc.onHover)
        sc.canvas.removeEventListener('pointerdown', sc.onPick)
      }
    }
  }, [activeSketchId])


  const btnz = [
    [MdDone, () => {
      treeEntries.byId[activeSketchId].deactivate()
      // dispatch({ type: 'update-descendents', sketch})
      sc.activeSketch = null
      sc.render()
      forceUpdate()
      // sc.activeDim = this.activeSketch.obj3d.children[1].children
    }, 'Finish'],
    [Icon.Extrude, extrude, 'Extrude [e]'],
    [Icon.Dimension, () => sc.activeSketch.drawDimension(), 'Dimension [d]'],
    [Icon.Line, () => sc.extrude(treeEntries.byId[activeSketchId]), 'Line [l]'],
    [Icon.Arc, () => sc.extrude(treeEntries.byId[activeSketchId]), 'Arc [a]'],
    [Icon.Coincident, () => sc.extrude(treeEntries.byId[activeSketchId]), 'Arc [space]'],
    [Icon.Vertical, () => sc.extrude(treeEntries.byId[activeSketchId]), 'Arc [v]'],
    [Icon.Horizontal, () => sc.extrude(treeEntries.byId[activeSketchId]), 'Arc [h]'],
  ]


  const btnz2 = [
    [FaEdit, sc.addSketch, 'Sketch [s]']
    ,
    [Icon.Extrude, extrude, 'Extrude [e]'],
    [Icon.Union, () => boolOp('u'), 'Union'],
    [Icon.Subtract, () => boolOp('s'), 'Subtract'],
    [Icon.Intersect, () => boolOp('i'), 'Intersect'],
    [MdSave, () => boolOp('i'), 'Save [ctrl+s]'],
    [MdFolder, () => boolOp('i'), 'Load'],
    [Icon.Stl, () => boolOp('i'), 'Export STL'],
  ]

  const [_, forceUpdate] = useReducer(x => x + 1, 0);

  return <div className='topNav flex justify-center items-center bg-gray-700'>
    {
      activeSketchId ?
        btnz.map(([Icon, fcn, txt, shortcut], idx) => (
          <Icon className="btn w-auto h-full p-3.5" tooltip={txt}
            onClick={fcn} key={idx}
          />
        ))
        :
        btnz2.map(([Icon, fcn, txt, shortcut], idx) => (
          <Icon className="btn w-auto h-full p-3.5" tooltip={txt}
            onClick={fcn} key={idx}
          />
        ))
    }
  </div>
}
