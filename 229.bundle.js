(self.webpackChunk=self.webpackChunk||[]).push([[229],{229:(e,t,i)=>{"use strict";i.r(t),i.d(t,{default:()=>s});const s=async(e,t={},i=null)=>{t.fileName=t.fileName||"Untitled",i=i||await window.chooseFileSystemEntries({type:"save-file",accepts:[{description:t.description||"",mimeTypes:[e.type],extensions:t.extensions||[""]}]});const s=await i.createWritable();return await s.write(e),await s.close(),i}}}]);