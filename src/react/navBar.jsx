

import React, { useEffect, useReducer } from 'react';

import { useDispatch, useSelector } from 'react-redux'

import { FaEdit, FaLinkedin, FaGithub } from 'react-icons/fa'
import { MdSave, MdFolder, MdInsertDriveFile } from 'react-icons/md'

import * as Icon from "./icons";
import { Dialog } from './dialog'
import { DropDown } from './dropDown'
import { STLExport, saveFile, openFile, verifyPermission } from './fileHelpers'

import { sce } from './app'
// import { serial, deserial} from './app'

export const NavBar = () => {
  const dispatch = useDispatch()
  const sketchActive = useSelector(state => state.ui.sketchActive)
  const treeEntries = useSelector(state => state.treeEntries)
  const fileHandle = useSelector(state => state.ui.fileHandle)
  const modified = useSelector(state => state.ui.modified)

  const boolOp = (code) => {
    if (sce.selected.length != 2 || !sce.selected.every(e => e.userData.type == 'mesh')) {
      alert('please first select two bodies for boolean operation')
      return
    }
    const [m1, m2] = sce.selected

    const mesh = sce.boolOp(m1, m2, code)

    sce.obj3d.add(mesh)

    dispatch({
      type: 'set-entry-visibility', obj: {
        [m1.name]: false,
        [m2.name]: false,
        [mesh.name]: true,
      }
    })

    dispatch({
      type: 'rx-boolean', mesh, deps: [m1.name, m2.name]
    })


    sce.render()
    forceUpdate()
  }


  const addSketch = () => {
    const sketch = sce.addSketch()
    if (!sketch) {
      alert('please select a plane or 3 points to set the sketch plane')
      return
    }

    dispatch({ type: 'rx-sketch', obj: sketch })

    sketch.activate()

    sce.render()

    dispatch({ type: 'set-dialog', action: 'sketch' })

    forceUpdate()
  }

  const confirmDiscard = () => !modified ? true : confirm('Discard changes? All changes will be lost.')




  useEffect(() => {
    const onBeforeUnload = (e) => {
      if (modified ||
        (sce.activeSketch &&
          (
            sce.activeSketch.hasChanged
            || sce.activeSketch.idOnActivate != id
            || sce.activeSketch.c_idOnActivate != sce.activeSketch.c_id
          )
        )
      ) {
        e.preventDefault();
        e.returnValue = `There are unsaved changes. Are you sure you want to leave?`;
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [modified])

  useEffect(() => {  // hacky way to handle mounting and unmounting mouse listeners for feature mode
    if (!sketchActive) {
      sce.canvas.addEventListener('pointermove', sce.onHover)
      sce.canvas.addEventListener('pointerdown', sce.onPick)
      return () => {
        sce.canvas.removeEventListener('pointermove', sce.onHover)
        sce.canvas.removeEventListener('pointerdown', sce.onPick)
      }
    }
  }, [sketchActive])

  const sketchModeButtons = [
    [Icon.Extrude, () => {
      dispatch({ type: 'set-dialog', action: 'extrude', target: sce.activeSketch })

    }, 'Extrude'],
    [Icon.Line, () => sce.activeSketch.command('l'), 'Line (L)'],
    [Icon.Arc, () => sce.activeSketch.command('a'), 'Arc (A)'],
    [Icon.Dimension, () => sce.activeSketch.command('d'), 'Dimension (D)'],
    [Icon.Coincident, () => sce.activeSketch.command('c'), 'Coincident (C)'],
    [Icon.Vertical, () => sce.activeSketch.command('v'), 'Vertical (V)'],
    [Icon.Horizontal, () => sce.activeSketch.command('h'), 'Horizontal (H)'],
    [Icon.Tangent, () => sce.activeSketch.command('t'), 'Tangent (T)'],
    [MdSave,
      async () => {
        saveFile(fileHandle, JSON.stringify([id, sce.sid, sce.mid, treeEntries]), dispatch)
        // saveFile(fileHandle, serial([id, sce.sid, sce.mid, treeEntries]), dispatch)
      }
      , 'Save'],
  ]


  const partModeButtons = [
    [FaEdit, addSketch, 'Sketch'],
    [Icon.Extrude, () => {
      try {
        dispatch({ type: 'set-dialog', action: 'extrude', target: treeEntries.byId[sce.selected[0].name] })
      } catch (err) {
        console.error(err)
        alert('please select a sketch from the left pane extrude')
      }

    }, 'Extrude'],

    [Icon.Union, () => boolOp('u'), 'Union'],
    [Icon.Subtract, () => boolOp('s'), 'Subtract'],
    [Icon.Intersect, () => boolOp('i'), 'Intersect'],
    [MdInsertDriveFile, () => {
      if (!confirmDiscard()) return
      sce.newPart()
      dispatch({ type: 'new-part' })
      sce.render()
    }, 'New'],
    [MdSave,
      () => {
        saveFile(fileHandle, JSON.stringify([id, sce.sid, sce.mid, treeEntries]), dispatch)
        // saveFile(fileHandle, serial([id, sce.sid, sce.mid, treeEntries]), dispatch)
      }
      , 'Save'],
    [MdFolder, () => {
      if (!confirmDiscard()) return
      openFile(dispatch).then(
        sce.render
      )
    }, 'Open'],
    [Icon.Stl, () => {
      if (sce.selected[0] && sce.selected[0].userData.type == 'mesh') {
        STLExport(fileHandle ? fileHandle.name.replace(/\.[^/.]+$/, "") : 'untitled')
      } else {
        alert('please first select one body to export')
      }
    }, 'Export to STL'],
  ]

  const [_, forceUpdate] = useReducer(x => x + 1, 0);

  return <div className='topNav flex justify-center items-center bg-gray-800'>

    {/* <div className='w-auto h-full flex-1 flex items-center justify-end'> */}
    <div className='w-auto h-full flex-1 flex items-center justify-end md:justify-between'>
      <div className='w-100 h-full items-center font-mono text-lg text-gray-200 select-none hidden lg:flex mr-8'>
        <Icon.Logo className='w-auto h-6 mx-1' />
          three.cad
      </div>
      <div className='h-full w-48 flex items-center justify-end'>
        <Dialog />
      </div>
    </div>
    <div className='w-auto h-full flex'>
      {(sketchActive ? sketchModeButtons : partModeButtons).map(
        ([Icon, fcn, txt], idx) => (
          Icon !== undefined ?
            <Icon className="btn text-gray-200 w-auto h-full p-3.5" tooltip={txt}
              onClick={fcn} key={idx}
            /> :
            <div className="w-12 h-full"></div>
        ))
      }
    </div>
    <div className='w-auto h-full flex-1 items-center justify-end flex-shrink-1 hidden md:flex'>
      <DropDown />
      <a href='https://github.com/twpride/threeCAD' className='h-full w=auto'>
        <FaGithub className="btn-green w-auto h-full p-3.5"></FaGithub>
      </a>
      <a href='https://www.linkedin.com/in/howard-hwang-b3000335' className='h-full w=auto'>
        <FaLinkedin className="btn-green w-auto h-full p-3.5"></FaLinkedin>
      </a>
    </div>

  </div>
}





