import { C } from "../lib/constants.js";

export default function Shell({ children }) {
  return (
    <div style={{ width:"100%", maxWidth:390, margin:"0 auto", height:"100dvh", minHeight:"-webkit-fill-available", background:C.bg, display:"flex", flexDirection:"column", position:"relative", overflow:"hidden" }}>
      {children}
      <style>{`* { box-sizing:border-box; -webkit-tap-highlight-color:transparent; } ::-webkit-scrollbar{display:none;} input[type=range]{-webkit-appearance:none;height:3px;background:rgba(240,244,255,0.15);border-radius:2px;outline:none;width:100%;} input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#ff5c5c;cursor:pointer;} @keyframes pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.05);}} @keyframes spin{to{transform:rotate(360deg);}}@keyframes slideDown{from{transform:translateY(-80px);opacity:0;}to{transform:translateY(0);opacity:1;}} @keyframes popIn{from{opacity:0;transform:scale(0.85);}to{opacity:1;transform:scale(1);}} @keyframes burstFly{to{transform:translate(var(--bx),var(--by)) scale(0.5);opacity:0;}} @keyframes flipInY{from{transform:rotateY(90deg);opacity:0.4;}to{transform:rotateY(0deg);opacity:1;}} div,button,input,textarea,span,a{touch-action:pan-x pan-y;} img{touch-action:pinch-zoom;}`}</style>
    </div>
  );
}
