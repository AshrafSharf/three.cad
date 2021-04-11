

import React, { useEffect, useReducer } from 'react';

import { useDispatch, useSelector } from 'react-redux'

import { FaCube, FaEdit } from 'react-icons/fa'
import { MdDone } from 'react-icons/md'
import * as Icon from "./icons";



export const NavBar = () => {
  const dispatch = useDispatch()
  const treeEntries = useSelector(state => state.treeEntries)
  const activeSketchId = useSelector(state => state.treeEntries.activeSketchId)

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
    activeSketchId ?
      [MdDone, () => {
        treeEntries.byId[activeSketchId].deactivate()
        // dispatch({ type: 'update-descendents', sketch})
        sc.activeSketch = null
        sc.render()
        forceUpdate()
        // sc.activeDim = this.activeSketch.obj3d.children[1].children
      }, 'Finish'] :
      [FaEdit, sc.addSketch, 'Sketch [s]']
    ,
    [FaCube, () => sc.extrude(treeEntries.byId[activeSketchId]), 'Extrude [e]'],
    [Icon.Union, () => sc.extrude(treeEntries.byId[activeSketchId]), 'Union'],
    [Icon.Subtract, () => {
      if (sc.selected.length != 2 || !sc.selected.every(e => e.userData.type == 'mesh')) return
      // console.log('here')
      const [m1, m2] = sc.selected
      const mesh = sc.subtract(m1, m2)

      dispatch({ type: 'rx-boolean', mesh, deps: [m1.name, m2.name] })
      sc.render()
      forceUpdate()
    }, 'Subtract'],
    [Icon.Intersect, () => sc.extrude(treeEntries.byId[activeSketchId]), 'Intersect'],
    [Icon.Dimension, () => sc.extrude(treeEntries.byId[activeSketchId]), 'Dimension [d]'],
    [Icon.Line, () => sc.extrude(treeEntries.byId[activeSketchId]), 'Line [l]'],
    [Icon.Arc, () => sc.extrude(treeEntries.byId[activeSketchId]), 'Arc [a]'],
  ]

  const [_, forceUpdate] = useReducer(x => x + 1, 0);

  return <div className='topNav flex justify-center items-center bg-gray-700'>
    {
      btnz.map(([Icon, fcn, txt, shortcut], idx) => (
        <Icon className="btn w-auto h-full p-3.5" tooltip={txt}
          onClick={fcn} key={idx}
        />
      ))
    }
  </div>
}
