/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import {useState} from 'react';
import Link from 'next/link';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import {House,Package,Gift,Store,Settings,LogOut,Menu,PanelLeftClose,Bell,ArrowUpRight,ChevronDown,MessageCircleQuestion} from 'lucide-react';
import {Sheet,Illustration,Empty,PageHeading} from './ui';

const nav=[
  ['','Dashboard',House],
  ['catalog','Catálogo y Productos',Package],
  ['faqs','Preguntas Frecuentes',MessageCircleQuestion],
  ['packages','Paquetes y Eventos',Gift],
] as const;

export function AdminShell({children}:{children?:React.ReactNode}){
    const [more,setMore]=useState(false);
    const [notifications,setNotifications]=useState(false);
    const [search,setSearch]=useState('');
    const path=usePathname();
    const router=useRouter();

    const link=(slug:string)=>`/admin${slug?'/'+slug:''}`;

    return <div className="app-shell">
        <a className="skip-link" href="#main">Ir al contenido</a>
        <aside className={`sidebar ${more?'expanded':''}`}>
            <Link className="shell-brand" href={link('')}>
                <Illustration name="brand/coffeeos-mark" size={32}/>
                <span>Tantre Admin</span>
            </Link>
            <button className="mobile-close icon-button" aria-label="Cerrar navegación" onClick={()=>setMore(false)}>
                <PanelLeftClose size={20}/>
            </button>
            <div className="workspace-label">TU ESTUDIO</div>
            <nav aria-label="Navegación principal">
                {nav.map(([slug,label,Icon])=><Link onClick={()=>setMore(false)} key={slug} href={link(slug)} className={(slug?path.startsWith(`/admin/${slug}`):path==='/admin')?'selected':''}>
                    <Icon size={19}/><span>{label}</span>
                </Link>)}
            </nav>
            <div className="sidebar-bottom">
                <Link href={link('settings')}><Settings size={18}/>Configuración</Link>
                <div className="brand-note">
                    <Illustration name="brand/coffeeos-leaf-sprout" size={42}/>
                    <p>Mil formas de crear.<br/><strong>Un café.</strong></p>
                </div>
                <Link className="store-link" href="#">
                    <Illustration name="operations/store" size={40}/>
                    <div><strong>Tantre</strong><small>Sucursal Principal</small></div>
                    <ChevronDown size={15}/>
                </Link>
            </div>
        </aside>

        <div className="workspace">
            <header className="topbar">
                <button className="icon-button mobile-menu" aria-label="Abrir navegación" onClick={()=>setMore(true)}>
                    <Menu size={20}/>
                </button>
                
                <form className="global-search" action="/admin/catalog">
                    <input aria-label="Buscar" name="q" placeholder="Buscar productos, items y más…" value={search} onChange={e=>setSearch(e.target.value)}/>
                    <kbd>↵</kbd>
                </form>

                <div className="topbar-right">
                    <button className="icon-button" aria-label="Notificaciones" onClick={()=>setNotifications(true)}><Bell size={20}/></button>
                    <Link className="profile" href="#">
                        <Illustration name="customers/customer-avatar-a" size={36}/>
                        <span><strong>Admin</strong><small>Administrador</small></span>
                    </Link>
                    <button className="icon-button" title="Cerrar Sesión" onClick={async () => {
                        const { api } = await import('@/lib/api');
                        await api("/auth/logout", { method: "POST", body: "{}" });
                        window.location.reload();
                    }}><LogOut size={20} /></button>
                </div>
            </header>

            <main id="main" className="main-content">
                {children}
            </main>

            <footer className="app-footer">
                <span>Cerámica · Café · y un poco de ti</span>
                <span>Tantre OS</span>
            </footer>
        </div>

        <nav className="bottom-nav" aria-label="Navegación móvil">
            <Link href={link('')}><House size={20}/>Inicio</Link>
            <Link href={link('catalog')}><Package size={20}/>Catálogo</Link>
            <button className="more-button" onClick={()=>setMore(true)}><Menu size={20}/>Más</button>
        </nav>

        {notifications&&<Sheet title="Tu estudio, al día" onClose={()=>setNotifications(false)}>
            <Empty title="Estás al día" description="Sin notificaciones pendientes." image="states/notifications"/>
        </Sheet>}
    </div>;
}
