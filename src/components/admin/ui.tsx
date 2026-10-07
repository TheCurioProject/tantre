'use client';
import {useEffect,useRef} from 'react';
import {X,ArrowUpRight,Plus} from 'lucide-react';
import { Brand } from '@/components/brand/Brand';

export const money=(minor:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN',minimumFractionDigits:2,maximumFractionDigits:2}).format(minor/100);

export function Illustration({name,size=64,alt=''}:{name:string;size?:number;alt?:string}){
    // Simplified to use Tantre's Brand component for all illustrations requested by Coffee OS
    return <Brand name="logo" className="illustration" style={{width: size, height: size}} aria-label={alt}/>;
}

export function Badge({children,tone='green'}:{children:React.ReactNode;tone?:string}){return <span className={`badge ${tone}`}>{children}</span>;}

export function Empty({title='Todavía no hay registros',description='Todo listo para comenzar.',image='states/empty-orders',children}:{title?:string;description?:string;image?:string;children?:React.ReactNode}){
    return <div className="empty">
        <Illustration name={image} size={120}/>
        <h3>{title}</h3>
        <p>{description}</p>
        {children}
    </div>;
}

export function Sheet({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}){
    const ref=useRef<HTMLDialogElement>(null);
    useEffect(()=>{
        const d=ref.current;
        const active=document.activeElement as HTMLElement|null;
        d?.showModal();
        return ()=>{d?.close();active?.focus();};
    },[]);
    return <dialog className="sheet" ref={ref} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
        <div className="sheet-heading">
            <h2>{title}</h2>
            <button className="icon-button" aria-label="Cerrar" onClick={onClose}><X size={20}/></button>
        </div>
        {children}
    </dialog>;
}

export function PageHeading({eyebrow,title,description,action}:{eyebrow?:string;title:string;description?:string;action?:React.ReactNode}){
    return <div className="page-heading">
        <div>
            {eyebrow&&<span className="eyebrow">{eyebrow}</span>}
            <h1>{title}</h1>
            {description&&<p>{description}</p>}
        </div>
        {action}
    </div>;
}

export function Metric({label,value,detail,icon,tone='green'}:{label:string;value:string|number;detail:string;icon:React.ReactNode;tone?:string}){
    return <article className="metric">
        <div className="row between">
            <span>{label}</span>
            <span className={`metric-icon ${tone}`}>{icon}</span>
        </div>
        <strong>{value}</strong>
        <small>{detail}</small>
    </article>;
}

export function Tabs({values,value,onChange}:{values:string[];value:string;onChange:(v:string)=>void}){
    return <div className="tabs" aria-label="Filtros">
        {values.map(v=><button key={v} className={v===value?'active':''} aria-pressed={v===value} onClick={()=>onChange(v)}>{v}</button>)}
    </div>;
}

export function AddButton({children,onClick}:{children:React.ReactNode;onClick:()=>void}){
    return <button onClick={onClick}><Plus size={18}/>{children}</button>;
}

export function Trend({children}:{children:React.ReactNode}){
    return <Badge><ArrowUpRight size={12}/>{children}</Badge>;
}

export function Chart({values,labels}:{values:number[];labels:string[]}){
    const max=Math.max(1,...values);
    return <div className="chart" role="img" aria-label={values.map((v,i)=>`${labels[i]}: ${money(v)}`).join(', ')}>
        {values.map((v,i)=><div className="bar-column" key={i}>
            <span className="chart-bar" title={`${labels[i]} · ${money(v)}`} style={{height:`${Math.max(2,v/max*100)}%`}}/>
            <small>{labels[i]}</small>
        </div>)}
    </div>;
}
