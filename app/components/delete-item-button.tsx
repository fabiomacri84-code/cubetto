"use client";
import { useFormStatus } from "react-dom";
import { deleteItem, deletePackItem } from "../actions";

function SubmitButton({name}:{name:string}) {
  const {pending}=useFormStatus();
  return <button type="submit" disabled={pending} aria-label={`Elimina ${name}`} title={`Elimina ${name}`} className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-white text-sm text-text-3 shadow-sm hover:bg-negative-soft hover:text-negative disabled:opacity-50"><span aria-hidden>{pending?"…":"🗑"}</span></button>;
}
export function DeleteItemButton({itemId,name,scope="list"}:{itemId:string;name:string;scope?:"list"|"pack"}) {
  return <form action={scope==="pack"?deletePackItem:deleteItem} onSubmit={scope==="pack"?(event)=>{if(!window.confirm(`Eliminare "${name}" dal pack?`))event.preventDefault();}:undefined}>
    <input type="hidden" name="id" value={itemId}/><SubmitButton name={name}/>
  </form>;
}
