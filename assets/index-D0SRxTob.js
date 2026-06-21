(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const s of document.querySelectorAll('link[rel="modulepreload"]'))i(s);new MutationObserver(s=>{for(const r of s)if(r.type==="childList")for(const o of r.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&i(o)}).observe(document,{childList:!0,subtree:!0});function t(s){const r={};return s.integrity&&(r.integrity=s.integrity),s.referrerPolicy&&(r.referrerPolicy=s.referrerPolicy),s.crossOrigin==="use-credentials"?r.credentials="include":s.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function i(s){if(s.ep)return;s.ep=!0;const r=t(s);fetch(s.href,r)}})();const Xc=!1,Zc=(n,e)=>n===e,ze=Symbol("solid-proxy"),Ui=Symbol("solid-track"),An={equals:Zc};let To=No;const Ue=1,Rn=2,ko={owned:null,cleanups:null,context:null,owner:null};var M=null;let Ii=null,el=null,D=null,V=null,me=null,ri=0;function wn(n,e){const t=D,i=M,s=n.length===0,r=e===void 0?i:e,o=s?ko:{owned:null,cleanups:null,context:r?r.context:null,owner:r},a=s?n:()=>n(()=>Ge(()=>qt(o)));M=o,D=null;try{return wt(a,!0)}finally{D=t,M=i}}function Re(n,e){e=e?Object.assign({},An,e):An;const t={value:n,observers:null,observerSlots:null,comparator:e.equals||void 0},i=s=>(typeof s=="function"&&(s=s(t.value)),Ro(t,s));return[Ao.bind(t),i]}function ne(n,e,t){const i=hs(n,e,!1,Ue);nn(i)}function tl(n,e,t){To=ol;const i=hs(n,e,!1,Ue);i.user=!0,me?me.push(i):nn(i)}function Mt(n,e,t){t=t?Object.assign({},An,t):An;const i=hs(n,e,!0,0);return i.observers=null,i.observerSlots=null,i.comparator=t.equals||void 0,nn(i),Ao.bind(i)}function nl(n){return wt(n,!1)}function Ge(n){if(D===null)return n();const e=D;D=null;try{return n()}finally{D=e}}function il(n){return M===null||(M.cleanups===null?M.cleanups=[n]:M.cleanups.push(n)),n}function $i(){return D}function Ao(){if(this.sources&&this.state)if(this.state===Ue)nn(this);else{const n=V;V=null,wt(()=>Pn(this),!1),V=n}if(D){const n=this.observers;if(!n||n[n.length-1]!==D){const e=n?n.length:0;D.sources?(D.sources.push(this),D.sourceSlots.push(e)):(D.sources=[this],D.sourceSlots=[e]),n?(n.push(D),this.observerSlots.push(D.sources.length-1)):(this.observers=[D],this.observerSlots=[D.sources.length-1])}}return this.value}function Ro(n,e,t){let i=n.value;return(!n.comparator||!n.comparator(i,e))&&(n.value=e,n.observers&&n.observers.length&&wt(()=>{for(let s=0;s<n.observers.length;s+=1){const r=n.observers[s],o=Ii&&Ii.running;o&&Ii.disposed.has(r),(o?!r.tState:!r.state)&&(r.pure?V.push(r):me.push(r),r.observers&&Po(r)),o||(r.state=Ue)}if(V.length>1e6)throw V=[],new Error},!1)),e}function nn(n){if(!n.fn)return;qt(n);const e=ri;sl(n,n.value,e)}function sl(n,e,t){let i;const s=M,r=D;D=M=n;try{i=n.fn(e)}catch(o){return n.pure&&(n.state=Ue,n.owned&&n.owned.forEach(qt),n.owned=null),n.updatedAt=t+1,Oo(o)}finally{D=r,M=s}(!n.updatedAt||n.updatedAt<=t)&&(n.updatedAt!=null&&"observers"in n?Ro(n,i):n.value=i,n.updatedAt=t)}function hs(n,e,t,i=Ue,s){const r={fn:n,state:i,updatedAt:null,owned:null,sources:null,sourceSlots:null,cleanups:null,value:e,owner:M,context:M?M.context:null,pure:t};return M===null||M!==ko&&(M.owned?M.owned.push(r):M.owned=[r]),r}function Nn(n){if(n.state===0)return;if(n.state===Rn)return Pn(n);if(n.suspense&&Ge(n.suspense.inFallback))return n.suspense.effects.push(n);const e=[n];for(;(n=n.owner)&&(!n.updatedAt||n.updatedAt<ri);)n.state&&e.push(n);for(let t=e.length-1;t>=0;t--)if(n=e[t],n.state===Ue)nn(n);else if(n.state===Rn){const i=V;V=null,wt(()=>Pn(n,e[0]),!1),V=i}}function wt(n,e){if(V)return n();let t=!1;e||(V=[]),me?t=!0:me=[],ri++;try{const i=n();return rl(t),i}catch(i){t||(me=null),V=null,Oo(i)}}function rl(n){if(V&&(No(V),V=null),n)return;const e=me;me=null,e.length&&wt(()=>To(e),!1)}function No(n){for(let e=0;e<n.length;e++)Nn(n[e])}function ol(n){let e,t=0;for(e=0;e<n.length;e++){const i=n[e];i.user?n[t++]=i:Nn(i)}for(e=0;e<t;e++)Nn(n[e])}function Pn(n,e){n.state=0;for(let t=0;t<n.sources.length;t+=1){const i=n.sources[t];if(i.sources){const s=i.state;s===Ue?i!==e&&(!i.updatedAt||i.updatedAt<ri)&&Nn(i):s===Rn&&Pn(i,e)}}}function Po(n){for(let e=0;e<n.observers.length;e+=1){const t=n.observers[e];t.state||(t.state=Rn,t.pure?V.push(t):me.push(t),t.observers&&Po(t))}}function qt(n){let e;if(n.sources)for(;n.sources.length;){const t=n.sources.pop(),i=n.sourceSlots.pop(),s=t.observers;if(s&&s.length){const r=s.pop(),o=t.observerSlots.pop();i<s.length&&(r.sourceSlots[o]=i,s[i]=r,t.observerSlots[i]=o)}}if(n.tOwned){for(e=n.tOwned.length-1;e>=0;e--)qt(n.tOwned[e]);delete n.tOwned}if(n.owned){for(e=n.owned.length-1;e>=0;e--)qt(n.owned[e]);n.owned=null}if(n.cleanups){for(e=n.cleanups.length-1;e>=0;e--)n.cleanups[e]();n.cleanups=null}n.state=0}function al(n){return n instanceof Error?n:new Error(typeof n=="string"?n:"Unknown error",{cause:n})}function Oo(n,e=M){throw al(n)}const cl=Symbol("fallback");function ar(n){for(let e=0;e<n.length;e++)n[e]()}function ll(n,e,t={}){let i=[],s=[],r=[],o=0,a=e.length>1?[]:null;return il(()=>ar(r)),()=>{let c=n()||[],l=c.length,h,u;return c[Ui],Ge(()=>{let f,m,v,E,N,P,O,L,J;if(l===0)o!==0&&(ar(r),r=[],i=[],s=[],o=0,a&&(a=[])),t.fallback&&(i=[cl],s[0]=wn(Be=>(r[0]=Be,t.fallback())),o=1);else if(o===0){for(s=new Array(l),u=0;u<l;u++)i[u]=c[u],s[u]=wn(d);o=l}else{for(v=new Array(l),E=new Array(l),a&&(N=new Array(l)),P=0,O=Math.min(o,l);P<O&&i[P]===c[P];P++);for(O=o-1,L=l-1;O>=P&&L>=P&&i[O]===c[L];O--,L--)v[L]=s[O],E[L]=r[O],a&&(N[L]=a[O]);for(f=new Map,m=new Array(L+1),u=L;u>=P;u--)J=c[u],h=f.get(J),m[u]=h===void 0?-1:h,f.set(J,u);for(h=P;h<=O;h++)J=i[h],u=f.get(J),u!==void 0&&u!==-1?(v[u]=s[h],E[u]=r[h],a&&(N[u]=a[h]),u=m[u],f.set(J,u)):r[h]();for(u=P;u<l;u++)u in v?(s[u]=v[u],r[u]=E[u],a&&(a[u]=N[u],a[u](u))):s[u]=wn(d);s=s.slice(0,o=l),i=c.slice(0)}return s});function d(f){if(r[u]=f,a){const[m,v]=Re(u);return a[u]=v,e(c[u],m)}return e(c[u])}}}function X(n,e){return Ge(()=>n(e||{}))}const ul=n=>`Stale read from <${n}>.`;function hl(n){const e="fallback"in n&&{fallback:()=>n.fallback};return Mt(ll(()=>n.each,n.children,e||void 0))}function rt(n){const e=n.keyed,t=Mt(()=>n.when,void 0,void 0),i=e?t:Mt(t,void 0,{equals:(s,r)=>!s==!r});return Mt(()=>{const s=i();if(s){const r=n.children;return typeof r=="function"&&r.length>0?Ge(()=>r(e?s:()=>{if(!Ge(i))throw ul("Show");return t()})):r}return n.fallback},void 0,void 0)}const Do=n=>Mt(()=>n());function dl(n,e,t){let i=t.length,s=e.length,r=i,o=0,a=0,c=e[s-1].nextSibling,l=null;for(;o<s||a<r;){if(e[o]===t[a]){o++,a++;continue}for(;e[s-1]===t[r-1];)s--,r--;if(s===o){const h=r<i?a?t[a-1].nextSibling:t[r-a]:c;for(;a<r;)n.insertBefore(t[a++],h)}else if(r===a)for(;o<s;)(!l||!l.has(e[o]))&&e[o].remove(),o++;else if(e[o]===t[r-1]&&t[a]===e[s-1]){const h=e[--s].nextSibling;n.insertBefore(t[a++],e[o++].nextSibling),n.insertBefore(t[--r],h),e[s]=t[r]}else{if(!l){l=new Map;let u=a;for(;u<r;)l.set(t[u],u++)}const h=l.get(e[o]);if(h!=null)if(a<h&&h<r){let u=o,d=1,f;for(;++u<s&&u<r&&!((f=l.get(e[u]))==null||f!==h+d);)d++;if(d>h-a){const m=e[o];for(;a<h;)n.insertBefore(t[a++],m)}else n.replaceChild(t[a++],e[o++])}else o++;else e[o++].remove()}}}const cr="_$DX_DELEGATE";function fl(n,e,t,i={}){let s;return wn(r=>{s=r,e===document?n():Y(e,n(),e.firstChild?null:void 0,t)},i.owner),()=>{s(),e.textContent=""}}function se(n,e,t,i){let s;const r=()=>{const a=document.createElement("template");return a.innerHTML=n,a.content.firstChild},o=()=>(s||(s=r())).cloneNode(!0);return o.cloneNode=o,o}function oi(n,e=window.document){const t=e[cr]||(e[cr]=new Set);for(let i=0,s=n.length;i<s;i++){const r=n[i];t.has(r)||(t.add(r),e.addEventListener(r,ml))}}function pl(n,e,t){t==null?n.removeAttribute(e):n.setAttribute(e,t)}function Ci(n,e){e==null?n.removeAttribute("class"):n.className=e}function xo(n,e,t,i){Array.isArray(t)?(n[`$$${e}`]=t[0],n[`$$${e}Data`]=t[1]):n[`$$${e}`]=t}function Lo(n,e,t){return Ge(()=>n(e,t))}function Y(n,e,t,i){if(t!==void 0&&!i&&(i=[]),typeof e!="function")return On(n,e,i,t);ne(s=>On(n,e(),s,t),i)}function ml(n){let e=n.target;const t=`$$${n.type}`,i=n.target,s=n.currentTarget,r=c=>Object.defineProperty(n,"target",{configurable:!0,value:c}),o=()=>{const c=e[t];if(c&&!e.disabled){const l=e[`${t}Data`];if(l!==void 0?c.call(e,l,n):c.call(e,n),n.cancelBubble)return}return e.host&&typeof e.host!="string"&&!e.host._$host&&e.contains(n.target)&&r(e.host),!0},a=()=>{for(;o()&&(e=e._$host||e.parentNode||e.host););};if(Object.defineProperty(n,"currentTarget",{configurable:!0,get(){return e||document}}),n.composedPath){const c=n.composedPath();r(c[0]);for(let l=0;l<c.length-2&&(e=c[l],!!o());l++){if(e._$host){e=e._$host,a();break}if(e.parentNode===s)break}}else a();r(i)}function On(n,e,t,i,s){for(;typeof t=="function";)t=t();if(e===t)return t;const r=typeof e,o=i!==void 0;if(n=o&&t[0]&&t[0].parentNode||n,r==="string"||r==="number"){if(r==="number"&&(e=e.toString(),e===t))return t;if(o){let a=t[0];a&&a.nodeType===3?a.data!==e&&(a.data=e):a=document.createTextNode(e),t=nt(n,t,i,a)}else t!==""&&typeof t=="string"?t=n.firstChild.data=e:t=n.textContent=e}else if(e==null||r==="boolean")t=nt(n,t,i);else{if(r==="function")return ne(()=>{let a=e();for(;typeof a=="function";)a=a();t=On(n,a,t,i)}),()=>t;if(Array.isArray(e)){const a=[],c=t&&Array.isArray(t);if(Wi(a,e,t,s))return ne(()=>t=On(n,a,t,i,!0)),()=>t;if(a.length===0){if(t=nt(n,t,i),o)return t}else c?t.length===0?lr(n,a,i):dl(n,t,a):(t&&nt(n),lr(n,a));t=a}else if(e.nodeType){if(Array.isArray(t)){if(o)return t=nt(n,t,i,e);nt(n,t,null,e)}else t==null||t===""||!n.firstChild?n.appendChild(e):n.replaceChild(e,n.firstChild);t=e}}return t}function Wi(n,e,t,i){let s=!1;for(let r=0,o=e.length;r<o;r++){let a=e[r],c=t&&t[n.length],l;if(!(a==null||a===!0||a===!1))if((l=typeof a)=="object"&&a.nodeType)n.push(a);else if(Array.isArray(a))s=Wi(n,a,c)||s;else if(l==="function")if(i){for(;typeof a=="function";)a=a();s=Wi(n,Array.isArray(a)?a:[a],Array.isArray(c)?c:[c])||s}else n.push(a),s=!0;else{const h=String(a);c&&c.nodeType===3&&c.data===h?n.push(c):n.push(document.createTextNode(h))}}return s}function lr(n,e,t=null){for(let i=0,s=e.length;i<s;i++)n.insertBefore(e[i],t)}function nt(n,e,t,i){if(t===void 0)return n.textContent="";const s=i||document.createTextNode("");if(e.length){let r=!1;for(let o=e.length-1;o>=0;o--){const a=e[o];if(s!==a){const c=a.parentNode===n;!r&&!o?c?n.replaceChild(s,a):n.insertBefore(s,t):c&&a.remove()}else r=!0}}else n.insertBefore(s,t);return[s]}const Bi=Symbol("store-raw"),ct=Symbol("store-node"),le=Symbol("store-has"),Mo=Symbol("store-self");function Fo(n){let e=n[ze];if(!e&&(Object.defineProperty(n,ze,{value:e=new Proxy(n,vl)}),!Array.isArray(n))){const t=Object.keys(n),i=Object.getOwnPropertyDescriptors(n),s=Object.getPrototypeOf(n),r=s!==null&&n!==null&&typeof n=="object"&&!Array.isArray(n)&&s!==Object.prototype;if(r){const o=Object.getOwnPropertyDescriptors(s);t.push(...Object.keys(o)),Object.assign(i,o)}for(let o=0,a=t.length;o<a;o++){const c=t[o];r&&c==="constructor"||i[c].get&&Object.defineProperty(n,c,{configurable:!0,enumerable:i[c].enumerable,get:i[c].get.bind(e)})}}return e}function Dn(n){let e;return n!=null&&typeof n=="object"&&(n[ze]||!(e=Object.getPrototypeOf(n))||e===Object.prototype||Array.isArray(n))}function jt(n,e=new Set){let t,i,s,r;if(t=n!=null&&n[Bi])return t;if(!Dn(n)||e.has(n))return n;if(Array.isArray(n)){Object.isFrozen(n)?n=n.slice(0):e.add(n);for(let o=0,a=n.length;o<a;o++)s=n[o],(i=jt(s,e))!==s&&(n[o]=i)}else{Object.isFrozen(n)?n=Object.assign({},n):e.add(n);const o=Object.keys(n),a=Object.getOwnPropertyDescriptors(n);for(let c=0,l=o.length;c<l;c++)r=o[c],!a[r].get&&(s=n[r],(i=jt(s,e))!==s&&(n[r]=i))}return n}function xn(n,e){let t=n[e];return t||Object.defineProperty(n,e,{value:t=Object.create(null)}),t}function zt(n,e,t){if(n[e])return n[e];const[i,s]=Re(t,{equals:!1,internal:!0});return i.$=s,n[e]=i}function _l(n,e){const t=Reflect.getOwnPropertyDescriptor(n,e);return!t||t.get||!t.configurable||e===ze||e===ct||(delete t.value,delete t.writable,t.get=()=>n[ze][e]),t}function Uo(n){$i()&&zt(xn(n,ct),Mo)()}function gl(n){return Uo(n),Reflect.ownKeys(n)}const vl={get(n,e,t){if(e===Bi)return n;if(e===ze)return t;if(e===Ui)return Uo(n),t;const i=xn(n,ct),s=i[e];let r=s?s():n[e];if(e===ct||e===le||e==="__proto__")return r;if(!s){const o=Object.getOwnPropertyDescriptor(n,e);$i()&&(typeof r!="function"||n.hasOwnProperty(e))&&!(o&&o.get)&&(r=zt(i,e,r)())}return Dn(r)?Fo(r):r},has(n,e){return e===Bi||e===ze||e===Ui||e===ct||e===le||e==="__proto__"?!0:($i()&&zt(xn(n,le),e)(),e in n)},set(){return!0},deleteProperty(){return!0},ownKeys:gl,getOwnPropertyDescriptor:_l};function Ln(n,e,t,i=!1){if(e==="__proto__"||!i&&n[e]===t)return;const s=n[e],r=n.length;t===void 0?(delete n[e],n[le]&&n[le][e]&&s!==void 0&&n[le][e].$()):(n[e]=t,n[le]&&n[le][e]&&s===void 0&&n[le][e].$());let o=xn(n,ct),a;if((a=zt(o,e,s))&&a.$(()=>t),Array.isArray(n)&&n.length!==r){for(let c=n.length;c<r;c++)(a=o[c])&&a.$();(a=zt(o,"length",r))&&a.$(n.length)}(a=o[Mo])&&a.$()}function $o(n,e){const t=Object.keys(e);for(let i=0;i<t.length;i+=1){const s=t[i];Wo(s)||Ln(n,s,e[s])}}function Wo(n){return n==="__proto__"||n==="constructor"||n==="prototype"}function yl(n,e){if(typeof e=="function"&&(e=e(n)),e=jt(e),Array.isArray(e)){if(n===e)return;let t=0,i=e.length;for(;t<i;t++){const s=e[t];n[t]!==s&&Ln(n,t,s)}Ln(n,"length",i)}else $o(n,e)}function Lt(n,e,t=[]){let i,s=n;if(e.length>1){i=e.shift();const o=typeof i,a=Array.isArray(n);if(o==="string"&&(i==="__proto__"||e.length>1&&Wo(i)))return;if(Array.isArray(i)){for(let c=0;c<i.length;c++)Lt(n,[i[c]].concat(e),t);return}else if(a&&o==="function"){for(let c=0;c<n.length;c++)i(n[c],c)&&Lt(n,[c].concat(e),t);return}else if(a&&o==="object"){const{from:c=0,to:l=n.length-1,by:h=1}=i;for(let u=c;u<=l;u+=h)Lt(n,[u].concat(e),t);return}else if(e.length>1){Lt(n[i],e,[i].concat(t));return}s=n[i],t=[i].concat(t)}let r=e[0];typeof r=="function"&&(r=r(s,t),r===s)||i===void 0&&r==null||(r=jt(r),i===void 0||Dn(s)&&Dn(r)&&!Array.isArray(r)?$o(s,r):Ln(n,i,r))}function wl(...[n,e]){const t=jt(n||{}),i=Array.isArray(t),s=Fo(t);function r(...o){nl(()=>{i&&o.length===1?yl(t,o[0]):Lt(t,o)})}return[s,r]}const El={id:"",name:"",setting:"",narrationStyle:"",premise:"",characters:[],location:"",locDesc:"",time:"",weather:"",travelLog:[],gold:{pp:0,gp:0,ep:0,sp:0,cp:0},incomeLog:[],expenseLog:[],inventory:{carried:{},wagon:[],hoard:[]},wagonState:{animals:[],maxWeight:0},quests:[],primaryMission:"",npcs:[],chapters:[],consequences:[],townReputation:[],secrets:[],moduleProgress:[],locations:[],combatState:{active:!1,round:0,initiative:[],currentTurn:0,actionsUsed:{action:!1,bonus:!1,reaction:!1,movement:!1},zones:{}},narrative:[],ooc:[],sessionArchive:[],checkpoints:[],contracts:{persona:"",never:"",actions:"",continuity:"",multi:"",module:"",dmSecrets:""}},Il={playerIdentity:{name:"",selectedPCs:[],mode:"single"},settings:{theme:"dark-0",ttsEnabled:!1,ttsVoice:null,pushEnabled:!1,pushSubscription:null},providers:{primary:"gemini",geminiKey:"",openrouterKey:"",lastProvider:"",health:{}},activeCampaignId:""},[p,g]=wl({campaign:structuredClone(El),system:structuredClone(Il)});function Cl(){g("campaign",{id:"demo_001",name:"The Road to Ashford",setting:"Classic fantasy, Sword Coast",narrationStyle:"Joe Abercrombie",premise:"A band of adventurers travels the old trade road toward Ashford, a frontier town plagued by strange disappearances. They carry cargo in a sturdy wagon and owe a debt to a merchant guild.",characters:[{id:"pc_ivy",name:"Ivy",backstory:"Former street urchin turned blade-for-hire.",appearance:"Short dark hair, quick eyes, leather armor patched at the elbows.",personality:"Dry humor, fiercely loyal, hates authority.",notes:"",race:"Human",class:"Rogue",subclass:"Thief",level:4,xp:2700,hpMax:31,ac:15,speed:30,hitDice:{die:"d8",total:4,used:0},abilityScores:{str:10,dex:18,con:12,int:14,wis:10,cha:12},savingThrows:["dex","int"],skills:{stealth:8,perception:4,sleightOfHand:8,acrobatics:6,investigation:4},proficiencies:["light armor","simple weapons","hand crossbows","rapiers","shortswords","thieves tools"],features:["Sneak Attack (2d6)","Cunning Action","Fast Hands","Second-Story Work","Uncanny Dodge"],cantrips:[],knownSpells:[],spellSlots:{},currentSlots:{},resources:[{name:"Sneak Attack",max:1,current:1,recharge:"turn"}],background:"Urchin",alignment:"Chaotic Good",languages:["Common","Thieves Cant"],attacks:[{name:"Rapier",bonus:6,damage:"1d8+4",type:"piercing"},{name:"Shortbow",bonus:6,damage:"1d6+4",type:"piercing",range:"80/320"}],color:"#4ae0a0",hp:31,hpTemp:0,conditions:[],concentration:null,exhaustion:0,inspiration:!1,deathSaves:{successes:0,failures:0},familiar:null},{id:"pc_thorn",name:"Thorn",backstory:"A half-elf raised by a circle of druids who cast him out for dabbling in arcane magic.",appearance:"Tall, weathered cloak, gnarled staff wrapped in ivy.",personality:"Quiet, protective of nature, surprisingly violent when cornered.",notes:"",race:"Half-Elf",class:"Bard",subclass:"College of Lore",level:4,xp:2700,hpMax:27,ac:13,speed:30,hitDice:{die:"d8",total:4,used:0},abilityScores:{str:8,dex:14,con:12,int:12,wis:10,cha:18},savingThrows:["dex","cha"],skills:{persuasion:6,performance:6,arcana:3,history:3,insight:2,perception:2},proficiencies:["light armor","simple weapons","hand crossbows","rapiers","longswords","shortswords","lute","flute","drum"],features:["Bardic Inspiration (d6)","Jack of All Trades","Song of Rest (d6)","Cutting Words","Font of Inspiration"],cantrips:["Vicious Mockery","Minor Illusion"],knownSpells:["Healing Word","Thunderwave","Faerie Fire","Shatter","Heat Metal","Suggestion","Invisibility"],spellSlots:{1:4,2:3},currentSlots:{1:4,2:3},resources:[{name:"Bardic Inspiration",max:4,current:4,recharge:"long"}],background:"Hermit",alignment:"Neutral Good",languages:["Common","Elvish","Sylvan"],attacks:[{name:"Rapier",bonus:4,damage:"1d8+2",type:"piercing"},{name:"Vicious Mockery",bonus:null,damage:"1d4 psychic",type:"psychic",save:"WIS DC 14"}],color:"#a070e0",hp:27,hpTemp:0,conditions:[],concentration:null,exhaustion:0,inspiration:!1,deathSaves:{successes:0,failures:0},familiar:null}],location:"Trade Road, 2 miles east of Ashford",locDesc:"A rutted dirt road cutting through sparse woodland. The wagon creaks over roots.",time:"Late afternoon",weather:"Overcast, cool wind",travelLog:[],gold:{pp:0,gp:45,ep:0,sp:12,cp:30},incomeLog:[],expenseLog:[],inventory:{carried:{},wagon:[{name:"Rope (50ft)",qty:2,type:"gear",weight:10},{name:"Rations",qty:14,type:"consumable",weight:2},{name:"Healing Potion",qty:3,type:"potion",weight:.5},{name:"Merchant Guild Cargo (sealed crate)",qty:1,type:"quest",weight:80}],hoard:[]},wagonState:{animals:[{name:"Biscuit",type:"ox",hp:15,hpMax:15}],maxWeight:500},quests:[{id:"qst_001",text:"Deliver the sealed crate to Ashford trading post",status:"active",location:"Ashford",giverNpc:"Guildmaster Harlen",notes:"",chatMsgId:"",discovery:{text:"",ts:""},gameTs:"",priority:1},{id:"qst_002",text:"Investigate the disappearances near Ashford",status:"active",location:"Ashford",giverNpc:"",notes:"Rumor: people vanish near the old mine",chatMsgId:"",discovery:{text:"",ts:""},gameTs:"",priority:0}],primaryMission:"Deliver the sealed crate to Ashford and investigate the disappearances.",npcs:[{id:"npc_001",name:"Guildmaster Harlen",disposition:"Business-like",details:"Gave the delivery job. Warned not to open the crate.",status:"active",hp:null,lastSeen:"Waterdeep",race:"Human",role:"quest-giver",gameTs:""}],chapters:[],consequences:[{id:"csq_001",text:"The crate must reach Ashford within 3 days or the guild marks the debt as defaulted.",type:"deadline",resolved:!1,resolvedTs:null,gameTs:"",location:"Trade Road",deadline:"3 days",_ripple:!1}],townReputation:[],secrets:[],moduleProgress:[],locations:[{id:"loc_001",name:"Ashford",type:"town",status:"undiscovered",firstVisited:"",lastVisited:"",rep:{disposition:"",notes:""},npcs:[],investments:[],history:[],dmNotes:"",playerNotes:"",mapPos:null}],combatState:{active:!1,round:0,initiative:[],currentTurn:0,actionsUsed:{action:!1,bonus:!1,reaction:!1,movement:!1},zones:{}},narrative:[],ooc:[],sessionArchive:[],checkpoints:[],contracts:{persona:"You are a darkly humorous Dungeon Master who loves morally gray choices, memorable NPCs, and tactical combat. You never pull punches but reward creativity. Your tone is cinematic and propulsive.",never:"Never kill a PC without death saves. Never reveal DM secrets. Never speak for a PC unless the player explicitly delegates. Never auto-resolve rolls.",actions:"One major scene per response. End every response with 2-3 meaningful choices. Keep combat turns tight — one turn per response.",continuity:"Track consequences. Reference past events. NPCs remember what the party did.",multi:"Address each PC by name. Give each character moments. Respect the party dynamic.",module:"",dmSecrets:"The sealed crate contains a captive fey creature. Guildmaster Harlen knows. The disappearances in Ashford are connected — the old mine is a portal."}}),g("system","activeCampaignId","demo_001")}const bl=`
OUTPUT FORMAT:
Write vivid narrative prose addressing each PC by name. After your narrative, output a Campaign State update and mechanics block:

***
**Campaign State:**
Location: [current location]
Time: [current game time]
Status: [brief situation summary]

---MECHANICS---
key: value
key: value
---END---

Present 2-3 bold choices: "How do you proceed?"

MECHANIC KEY REFERENCE:
hp: Name=value | conditions: Name+Condition | conditions: Name-Condition
concentration: Name=spell | concentration: Name=none
slot_use: Name=level | slot_restore: Name=level
resource_use: Name,ResourceName | resource_restore: Name=all
xp: Name+amount | xp: party+amount
gp: +amount | income: amount, category, desc | expense: amount, desc
item_add: target, name, qty, type, weight | item_remove: target, name, qty
location: Name | time: value | weather: value | loc_desc: text
quest_add: text | quest_done: name | quest_fail: name | quest_update: name|notes
primary_mission: text | npc_add: name, disposition, details | npc_mood: name=mood
consequence_add: text|type | consequence_resolve: text
chapter_add: Title|Content | location_add: Name|Type|Description
location_visit: Name | town_rep: town, status, notes
combat_start: desc | combat_end: summary | zone_add_enemy: Name|HP|AC|Zone|Init
zone_move: Name|Zone | zone_remove: Name | roll_request: Skill|DC|PCname
death_save: Name|success/failure | short_rest: Name
spell_add: PC|Name|Level|CastTime|Range|Duration|Components|Desc
familiar_hp: Name|HP | animal_hp: Name=HP

ROLL PROCEDURE:
When a player action requires a check, emit: roll_request: Skill|DC|PCname
Do NOT resolve the roll yourself. Wait for the player to submit the result.
Format: "Roll Request: [Skill] ([PC]) | DC [X] | [Context]"

COMBAT ZONES: front, back, left, right, air, rear
Adjacency: Front↔Left, Front↔Right, Front↔Back, Front↔Air, Back↔Rear

CRITICAL RULES:
- Every mechanic MUST be in the ---MECHANICS--- block. Never narrate state changes without emitting the corresponding mechanic.
- XP values are DELTAS (encounter awards), never cumulative totals.
- Income category: reward/found/loot/quest/trade. Always log income when treasure is found.
- item_add target: wagon/cargo/hoard/party/PCname. Include weight.
- HP is clamped to 0–hp_max. 0 HP triggers death saves.
- Emit none: if no state changes occurred.
`.trim();function Sl(){const n=p.campaign.contracts,e=p.campaign,t=[];return n.persona&&t.push(n.persona),e.premise&&t.push(`LOCKED PREMISE (facts you cannot contradict):
${e.premise}`),n.never&&t.push(`PROHIBITIONS:
${n.never}

INVENTORY INTEGRITY: Never narrate items being found, given, purchased, or used without emitting the corresponding item_add or item_remove mechanic.`),n.actions&&t.push(`PACING & ACTIONS:
${n.actions}`),n.continuity&&t.push(`CONTINUITY:
${n.continuity}`),n.multi&&t.push(`MULTI-PLAYER:
${n.multi}`),t.push(bl),n.module&&t.push(`MODULE FIDELITY:
${n.module}`),n.dmSecrets&&t.push(`DM SECRETS (never reveal to players):
${n.dmSecrets}`),e.narrationStyle&&t.push(`NARRATION STYLE: Write narrative prose in the style of ${e.narrationStyle}.`),t.join(`

---

`)}const Tl='You are a D&D 5e rules arbiter. Answer the question using the character data, campaign situation, and reference material provided. Be precise, cite rules sources. Advisory only — do not emit mechanics, do not advance the game state, do not narrate actions. If the question involves a hypothetical ("what would happen if..."), reason through it using the current situation but make clear this is theoretical.',kl="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent",Al="https://openrouter.ai/api/v1/chat/completions";function ds(){const{providers:n}=p.system;return{primary:n.primary,geminiKey:n.geminiKey,openrouterKey:n.openrouterKey,health:n.health}}function Rl(n){const e=p.system.providers.health[n]||{failures:0,lastFail:null};e.failures++,e.lastFail=Date.now()}function Nl(n){const e=p.system.providers.health[n];if(!e||e.failures===0)return!0;const t=Math.min(6e4*Math.pow(2,e.failures-1),3e5);return Date.now()-e.lastFail>t}function Pl(n,e){const t=n.map(i=>({role:i.role==="assistant"?"model":"user",parts:[{text:i.content}]}));return{system_instruction:{parts:[{text:e}]},contents:t,generationConfig:{temperature:.9,maxOutputTokens:4096}}}function Ol(n,e){return{model:"google/gemini-2.0-flash-exp:free",messages:[{role:"system",content:e},...n],temperature:.9,max_tokens:4096,stream:!0}}async function*Dl(n,e,t){var l,h,u,d,f;const i=ds();if(!i.geminiKey)throw new Error("Gemini API key not set");const s=`${kl}?key=${i.geminiKey}&alt=sse`,r=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Pl(n,e)),signal:t});if(!r.ok){const m=await r.text().catch(()=>r.statusText);throw new Error(`Gemini ${r.status}: ${m}`)}const o=r.body.getReader(),a=new TextDecoder;let c="";for(;;){const{done:m,value:v}=await o.read();if(m)break;c+=a.decode(v,{stream:!0});const E=c.split(`
`);c=E.pop();for(const N of E){if(!N.startsWith("data: "))continue;const P=N.slice(6).trim();if(P==="[DONE]")return;try{const L=(f=(d=(u=(h=(l=JSON.parse(P).candidates)==null?void 0:l[0])==null?void 0:h.content)==null?void 0:u.parts)==null?void 0:d[0])==null?void 0:f.text;L&&(yield L)}catch{}}}}async function*xl(n,e,t){var c,l,h;const i=ds();if(!i.openrouterKey)throw new Error("OpenRouter API key not set");const s=await fetch(Al,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${i.openrouterKey}`,"HTTP-Referer":"https://tinklepebble.app"},body:JSON.stringify(Ol(n,e)),signal:t});if(!s.ok){const u=await s.text().catch(()=>s.statusText);throw new Error(`OpenRouter ${s.status}: ${u}`)}const r=s.body.getReader(),o=new TextDecoder;let a="";for(;;){const{done:u,value:d}=await r.read();if(u)break;a+=o.decode(d,{stream:!0});const f=a.split(`
`);a=f.pop();for(const m of f){if(!m.startsWith("data: "))continue;const v=m.slice(6).trim();if(v==="[DONE]")return;try{const N=(h=(l=(c=JSON.parse(v).choices)==null?void 0:c[0])==null?void 0:l.delta)==null?void 0:h.content;N&&(yield N)}catch{}}}}async function*Bo(n,e,t){const s=ds().primary==="openrouter"?["openrouter","gemini"]:["gemini","openrouter"];let r=null;for(const o of s)if(Nl(o))try{const a=o==="gemini"?Dl(n,e,t):xl(n,e,t);for await(const c of a)yield c;return}catch(a){if(a.name==="AbortError")throw a;Rl(o),r=a}throw r||new Error("No AI providers available")}function Hi(n){return Math.ceil(n.length/4)}function Ho(n="compact"){const e=p.campaign,t=[];if(n==="compact"){t.push("=== CAMPAIGN COMPACT STATE ==="),t.push(`Location: ${e.location||"Unknown"} | Time: ${e.time||"Unknown"} | Weather: ${e.weather||"Clear"}`),t.push("");for(const l of e.characters){const h=[`${l.name} (${l.race} ${l.class}${l.subclass?` (${l.subclass})`:""} Lv${l.level})`];h.push(`HP ${l.hp}/${l.hpMax}`),h.push(`AC ${l.ac}`),l.conditions.length>0&&h.push(`Conditions: ${l.conditions.map(d=>d.name||d).join(", ")}`),l.concentration&&h.push(`Concentrating: ${l.concentration.spell||l.concentration}`);const u=[];for(const[d,f]of Object.entries(l.spellSlots)){const m=l.currentSlots[d]??f;u.push(`L${d}:${m}/${f}`)}u.length&&h.push(`Slots: ${u.join(" ")}`),t.push(h.join(" | "))}e.combatState.active&&(t.push(""),t.push(Ll(e.combatState)));const{gp:i,sp:s,cp:r,pp:o,ep:a}=e.gold,c=[o&&`PP ${o}`,i&&`GP ${i}`,a&&`EP ${a}`,s&&`SP ${s}`,r&&`CP ${r}`].filter(Boolean).join(", ");c&&t.push(`Treasury: ${c}`),t.push("=== END COMPACT ===")}else{t.push(`=== ${(e.name||"CAMPAIGN").toUpperCase()} — CAMPAIGN STATE LEDGER ===`),t.push(""),t.push("━━━ PARTY STATUS ━━━");for(const i of e.characters)t.push(`${i.name} (${i.race} ${i.class} Lv${i.level}): HP ${i.hp}/${i.hpMax} AC ${i.ac}`);if(t.push(""),e.quests.length){t.push("━━━ QUESTS ━━━"),e.primaryMission&&t.push(`Main Quest: ${e.primaryMission}`);for(const i of e.quests)t.push(`[${i.status}] ${i.text}`);t.push("")}if(e.npcs.length){t.push("━━━ NPCs ━━━");for(const i of e.npcs.filter(s=>s.status==="active"))t.push(`${i.name} (${i.disposition}) — ${i.details}`);t.push("")}if(e.consequences.filter(i=>!i.resolved).length){t.push("━━━ ACTIVE CONSEQUENCES ━━━");for(const i of e.consequences.filter(s=>!s.resolved))t.push(`[${i.type}] ${i.text}`);t.push("")}t.push("=== END LEDGER ===")}return t.join(`
`)}function Ll(n){var i;const e=["ACTIVE COMBAT — ROUND "+n.round],t={};for(const s of n.initiative){const r=s.zone||"front";t[r]||(t[r]=[]),t[r].push(s)}e.push("Zone layout:");for(const[s,r]of Object.entries(t)){const o=((i=n.zones[s])==null?void 0:i.label)||s.charAt(0).toUpperCase()+s.slice(1);e.push(`  [${o}]`);for(const a of r){const c=n.initiative.indexOf(a)===n.currentTurn?">>> ":"    ";e.push(`${c}${a.roll} ${a.name} HP:${a.hp}/${a.hpMax} AC:${a.ac}`)}}return e.join(`
`)}function Ml(n=""){const e=Sl(),t=Ho("compact"),i=p.campaign.consequences.filter(o=>!o.resolved).map(o=>`- [${o.type}] ${o.text}${o.deadline?` (deadline: ${o.deadline})`:""}`).join(`
`),s=[e];i&&s.push(`ACTIVE CONSEQUENCES (track these — they have ongoing effects):
${i}`),n&&s.push(n),s.push(t);const r=s.join(`

`);return{prompt:r,tokens:Hi(r)}}function Fl(n){const e=Ho("compact"),t=p.campaign.characters.map(i=>`${i.name}: ${i.race} ${i.class} Lv${i.level}, HP ${i.hp}/${i.hpMax}`).join(`
`);return`Current situation:
${e}

Characters:
${t}

Question: ${n}`}const ur=new Set(["hp","hp_max","conditions","concentration","location","time","weather","travel_note","loc_desc","gp","sp","cp","ep","pp","item_add","item_remove","slot_use","slot_restore","resource_use","resource_restore","shell_defense","wagon_add","wagon_cell_add","wagon_cell_update","wagon_cell_remove","wagon_hp","ox_hp","ox_condition","familiar_hp","animal_hp","animal_condition","income","expense","xp","quest_add","quest_done","quest_fail","quest_update","primary_mission","npc_add","npc_mood","pc_update","pc_add","pc_delete","module_episode","short_rest","town_rep","save_game","save","spell_add","sp_charge","consequence_add","consequence_resolve","chapter_add","chapter_update","location_add","location_visit","location_history","location_investment","roll_request","zone_move","zone_add_enemy","zone_remove","zone_effect","zone_label","combat_start","combat_end","zone_fog","death_save","none"]);function Ul(n){if(!n)return null;const e=n.toLowerCase().trim();return p.campaign.characters.find(t=>t.name.toLowerCase()===e||t.name.toLowerCase().startsWith(e)||e.startsWith(t.name.toLowerCase().split(" ")[0]))||null}function re(n){if(!n)return-1;const e=n.toLowerCase().trim();return p.campaign.characters.findIndex(t=>t.name.toLowerCase()===e||t.name.toLowerCase().startsWith(e)||e.startsWith(t.name.toLowerCase().split(" ")[0]))}function $l(n){let e=n.replace(/\*\*/g,"").replace(/\*/g,"");return e=e.replace(/\[([a-z_]+:\s*[^\]]+)\]/g,"$1"),e}function Wl(n){const e=$l(n);let t="";const i=[/---MECHANICS---\n?([\s\S]*?)---END---/i,/MECHANICS BLOCK:\n?([\s\S]*?)---END---/i,/MECHANICS BLOCK:\n?([\s\S]*?)(?=\n\n[A-Z])/i,/---MECHANICS---\n?([\s\S]*?)$/i,/MECHANICS:\n?([\s\S]*?)(?:---END---|$)/i];for(const a of i){const c=e.match(a);if(c){t=c[1];break}}if(t||(t=e.split(`
`).filter(l=>{const h=l.match(/^\s*[-*•]?\s*([a-z_]+)\s*:\s*(.+)/i);return h&&ur.has(h[1].toLowerCase())}).join(`
`)),!t.trim())return[];const s=t.split(`
`).map(a=>a.replace(/^\s*[-*•]\s*/,"").trim()).filter(Boolean),r=[];for(const a of s){if(a.includes("|")&&a.includes("|")){const c=a.split(/\s*\|\s*/);if(c.length>1&&c.every(l=>/^[a-z_]+\s*:/i.test(l))){r.push(...c);continue}}r.push(a)}const o=[];for(const a of r){const c=a.match(/^([a-z_]+)\s*:\s*(.+)/i);if(!c)continue;const l=c[1].toLowerCase(),h=c[2].trim();ur.has(l)&&(h==="none"||h==="0"||h.startsWith("0,")||o.push({key:l,value:h,target:"",applied:!1}))}return o}function Bl(n){const e=[],t=[];for(const i of n){const s=Hl(i);s?t.push({...i,reason:s}):e.push(i)}return{valid:e,rejected:t}}function Hl(n){var e;if(n.key==="combat_start"&&p.campaign.combatState.active)return"Combat already active";if(n.key==="zone_add_enemy"){const t=(e=n.value.split("|")[0])==null?void 0:e.trim();if(p.campaign.combatState.initiative.some(i=>i.name.toLowerCase()===(t==null?void 0:t.toLowerCase())))return`${t} already in combat`}return["income","gp","sp","cp","ep","pp"].includes(n.key)&&/xp/i.test(n.value)?"XP is not currency":(n.key==="hp_max"&&(n._warning="hp_max should be set by level-up wizard, not AI"),null)}function Vl(n){const e=[];for(const t of n)try{ql(t),t.applied=!0,e.push(t)}catch(i){t.applied=!1,t.error=i.message,e.push(t)}return e}function ql(n){const e=En[n.key];e&&e(n.value)}function hr(n){return n.split(",").map(e=>{const[t,i]=e.split("=").map(s=>s.trim());return{name:t,value:parseInt(i,10)}}).filter(e=>!isNaN(e.value))}const En={hp(n){for(const{name:e,value:t}of hr(n)){const i=re(e);if(i===-1)continue;const s=p.campaign.characters[i],r=Math.max(0,Math.min(t,s.hpMax));g("campaign","characters",i,"hp",r)}},hp_max(n){for(const{name:e,value:t}of hr(n)){const i=re(e);i!==-1&&g("campaign","characters",i,"hpMax",t)}},conditions(n){const e=n.match(/^(.+?)([+-=])(.+)$/);if(!e)return;const[,t,i,s]=e.map(a=>a==null?void 0:a.trim()),r=re(t);if(r===-1)return;const o=[...p.campaign.characters[r].conditions];if(i==="-"){const a=o.filter(c=>(c.name||c).toLowerCase()!==s.toLowerCase());g("campaign","characters",r,"conditions",a)}else o.some(a=>(a.name||a).toLowerCase()===s.toLowerCase())||g("campaign","characters",r,"conditions",[...o,{name:s,duration:null}])},concentration(n){const[e,t]=n.split("=").map(s=>s.trim()),i=re(e);i!==-1&&g("campaign","characters",i,"concentration",t.toLowerCase()==="none"?null:{spell:t,since:p.campaign.combatState.round||""})},location(n){const e=p.campaign.location;g("campaign","location",n.trim()),e&&g("campaign","travelLog",[...p.campaign.travelLog,{from:e,to:n.trim(),note:"",gameTs:p.campaign.time}])},time(n){g("campaign","time",n.trim())},weather(n){g("campaign","weather",n.trim())},loc_desc(n){g("campaign","locDesc",n.trim())},primary_mission(n){g("campaign","primaryMission",n.trim())},travel_note(n){const e=[...p.campaign.travelLog];e.length&&(e[e.length-1]={...e[e.length-1],note:(e[e.length-1].note||"")+`
`+n.trim()},g("campaign","travelLog",e))},gp(n){Nt("gp",n)},sp(n){Nt("sp",n)},cp(n){Nt("cp",n)},ep(n){Nt("ep",n)},pp(n){Nt("pp",n)},income(n){const e=n.split(",").map(r=>r.trim()),t=parseInt(e[0],10)||0,i=e[1]||"misc",s=e.slice(2).join(", ")||"";g("campaign","gold","gp",Math.max(0,p.campaign.gold.gp+t)),g("campaign","incomeLog",[...p.campaign.incomeLog,{amount:t,category:i,desc:s,gameTs:p.campaign.time}])},expense(n){const e=n.split(",").map(s=>s.trim()),t=parseInt(e[0],10)||0,i=e.slice(1).join(", ")||"";g("campaign","gold","gp",Math.max(0,p.campaign.gold.gp-t)),g("campaign","expenseLog",[...p.campaign.expenseLog,{amount:t,desc:i,gameTs:p.campaign.time}])},xp(n){const e=n.match(/^(.+?)\+(\d+)$/);if(!e)return;const[,t,i]=e,s=parseInt(i,10);if(t.toLowerCase()==="party")p.campaign.characters.forEach((r,o)=>{g("campaign","characters",o,"xp",r.xp+s)});else{const r=re(t);if(r===-1)return;g("campaign","characters",r,"xp",p.campaign.characters[r].xp+s)}},quest_add(n){const e=n.trim(),t=e.substring(0,30).toLowerCase();p.campaign.quests.some(i=>i.text.substring(0,30).toLowerCase()===t)||g("campaign","quests",[...p.campaign.quests,{id:"qst_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),text:e,status:"active",location:p.campaign.location,giverNpc:"",notes:"",chatMsgId:"",discovery:{text:"",ts:new Date().toISOString()},gameTs:p.campaign.time,priority:0}])},quest_done(n){const e=n.trim().toLowerCase(),t=p.campaign.quests.map(i=>i.text.toLowerCase().includes(e)||e.includes(i.text.substring(0,20).toLowerCase())?{...i,status:"done"}:i);g("campaign","quests",t)},quest_fail(n){const e=n.trim().toLowerCase(),t=p.campaign.quests.map(i=>i.text.toLowerCase().includes(e)||e.includes(i.text.substring(0,20).toLowerCase())?{...i,status:"failed"}:i);g("campaign","quests",t)},quest_update(n){const[e,...t]=n.split("|"),i=t.join("|").trim(),s=e.trim().toLowerCase(),r=p.campaign.quests.map(o=>o.text.toLowerCase().includes(s)?{...o,notes:(o.notes?o.notes+`
`:"")+i}:o);g("campaign","quests",r)},npc_add(n){const e=n.split(",").map(o=>o.trim()),t=e[0]||"",i=e[1]||"Unknown",s=e.slice(2).join(", ")||"",r=p.campaign.npcs.findIndex(o=>o.name.toLowerCase()===t.toLowerCase());r>=0?g("campaign","npcs",r,{...p.campaign.npcs[r],disposition:i,details:s,lastSeen:p.campaign.location}):g("campaign","npcs",[...p.campaign.npcs,{id:"npc_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),name:t,disposition:i,details:s,status:"active",hp:null,lastSeen:p.campaign.location,race:"",role:"",gameTs:p.campaign.time}])},npc_mood(n){const[e,t]=n.split("=").map(s=>s.trim()),i=p.campaign.npcs.findIndex(s=>s.name.toLowerCase()===e.toLowerCase());i>=0&&g("campaign","npcs",i,"disposition",t)},consequence_add(n){const[e,t="background"]=n.split("|").map(r=>r.trim()),i=e.toLowerCase().split(/\s+/);p.campaign.consequences.some(r=>{const o=r.text.toLowerCase().split(/\s+/);return i.filter(c=>o.includes(c)).length/Math.max(i.length,1)>.6})||g("campaign","consequences",[...p.campaign.consequences,{id:"csq_"+Date.now(),text:e,type:t,resolved:!1,resolvedTs:null,gameTs:p.campaign.time,location:p.campaign.location,deadline:null,_ripple:!1}])},consequence_resolve(n){const e=n.trim().toLowerCase(),t=p.campaign.consequences.map(i=>i.text.toLowerCase().includes(e)&&!i.resolved?{...i,resolved:!0,resolvedTs:new Date().toISOString()}:i);g("campaign","consequences",t)},chapter_add(n){const[e,...t]=n.split("|"),i=t.join("|").trim();g("campaign","chapters",[...p.campaign.chapters,{id:Date.now(),title:e.trim(),content:i,gameTs:p.campaign.time}])},chapter_update(n){const[e,...t]=n.split("|"),i=t.join("|").trim(),s=e.trim().toLowerCase(),r=p.campaign.chapters.map(o=>o.title.toLowerCase().includes(s)?{...o,content:i}:o);g("campaign","chapters",r)},town_rep(n){const e=n.split(",").map(o=>o.trim()),t=e[0],i=e[1]||"neutral",s=e.slice(2).join(", "),r=p.campaign.townReputation.findIndex(o=>o.town.toLowerCase()===t.toLowerCase());if(r>=0){const o=p.campaign.townReputation[r],a=[...o.history||[],{status:o.status,notes:o.notes,gameTs:o.gameTs}];g("campaign","townReputation",r,{...o,status:i,notes:s,gameTs:p.campaign.time,history:a})}else g("campaign","townReputation",[...p.campaign.townReputation,{town:t,status:i,notes:s,gameTs:p.campaign.time,history:[]}]);["burned","fled"].includes(i.toLowerCase())&&En.consequence_add(`Word of the incident in ${t} is spreading. Reputation affected.|faction`)},location_add(n){const[e,t="waypoint",...i]=n.split("|").map(o=>o.trim()),s=i.join("|"),r=p.campaign.locations.findIndex(o=>o.name.toLowerCase()===e.toLowerCase());r>=0?(g("campaign","locations",r,"type",t),s&&g("campaign","locations",r,"history",[...p.campaign.locations[r].history,{gameTs:p.campaign.time,text:s,dmOnly:!1}])):g("campaign","locations",[...p.campaign.locations,{id:"loc_"+Date.now()+"_"+Math.random().toString(36).slice(2,6),name:e,type:t,status:"undiscovered",firstVisited:"",lastVisited:"",rep:{disposition:"",notes:""},npcs:[],investments:[],history:s?[{gameTs:p.campaign.time,text:s,dmOnly:!1}]:[],dmNotes:"",playerNotes:"",mapPos:null}])},location_visit(n){const e=n.trim(),t=p.campaign.locations.findIndex(i=>i.name.toLowerCase()===e.toLowerCase());t>=0&&(g("campaign","locations",t,"status","visited"),g("campaign","locations",t,"lastVisited",p.campaign.time),p.campaign.locations[t].firstVisited||g("campaign","locations",t,"firstVisited",p.campaign.time))},location_history(n){const e=n.split("|").map(o=>o.trim()),t=e[0],i=e[1]||"",s=e[2]==="true",r=p.campaign.locations.findIndex(o=>o.name.toLowerCase()===t.toLowerCase());r>=0&&g("campaign","locations",r,"history",[...p.campaign.locations[r].history,{gameTs:p.campaign.time,text:i,dmOnly:s}])},location_investment(n){const[e,t,i]=n.split("|").map(o=>o.trim()),s=parseInt(i,10)||0,r=p.campaign.locations.findIndex(o=>o.name.toLowerCase()===e.toLowerCase());r>=0&&g("campaign","locations",r,"investments",[...p.campaign.locations[r].investments,{desc:t,amount:s,gameTs:p.campaign.time,notes:""}])},item_add(n){const e=n.split(",").map(c=>c.trim());let t="wagon",i,s,r,o;e.length>=5?[t,i,s,r,o]=e:e.length===4?[i,s,r,o]=e:(i=e[0],s=e[1]||"1",r=e[2]||"item",o=e[3]||"0");const a={name:i,qty:parseInt(s,10)||1,type:r,weight:parseFloat(o)||0};if(t.toLowerCase()==="wagon")g("campaign","inventory","wagon",[...p.campaign.inventory.wagon,a]);else if(t.toLowerCase()==="hoard")g("campaign","inventory","hoard",[...p.campaign.inventory.hoard,a]);else{const c=Ul(t),l=c?c.id:"party",h={...p.campaign.inventory.carried};h[l]=[...h[l]||[],a],g("campaign","inventory","carried",h)}},item_remove(n){const e=n.split(",").map(c=>c.trim()),[t,i,s]=e,r=parseInt(s,10)||1,o=i==null?void 0:i.toLowerCase();function a(c){const l=c.findIndex(u=>u.name.toLowerCase().includes(o));if(l===-1)return c;const h=[...c];return h[l].qty<=r?h.splice(l,1):h[l]={...h[l],qty:h[l].qty-r},h}(t==null?void 0:t.toLowerCase())==="wagon"?g("campaign","inventory","wagon",a(p.campaign.inventory.wagon)):(t==null?void 0:t.toLowerCase())==="hoard"&&g("campaign","inventory","hoard",a(p.campaign.inventory.hoard))},slot_use(n){const[e,t]=n.split("=").map(o=>o.trim()),i=re(e);if(i===-1)return;const s=t,r=p.campaign.characters[i].currentSlots[s];r>0&&g("campaign","characters",i,"currentSlots",s,r-1)},slot_restore(n){const[e,t]=n.split("=").map(s=>s.trim()),i=re(e);if(i!==-1)if(t.toLowerCase()==="all"){const s=p.campaign.characters[i];g("campaign","characters",i,"currentSlots",{...s.spellSlots})}else{const s=p.campaign.characters[i].spellSlots[t]||0;g("campaign","characters",i,"currentSlots",t,s)}},resource_use(n){const[e,t]=n.split(",").map(r=>r.trim()),i=re(e);if(i===-1)return;const s=p.campaign.characters[i].resources.map(r=>r.name.toLowerCase().includes(t.toLowerCase())&&r.current>0?{...r,current:r.current-1}:r);g("campaign","characters",i,"resources",s)},resource_restore(n){const[e,t]=n.split("=").map(s=>s.trim()),i=re(e);if(i!==-1&&t.toLowerCase()==="all"){const s=p.campaign.characters[i].resources.map(r=>({...r,current:r.max}));g("campaign","characters",i,"resources",s)}},combat_start(n){g("campaign","combatState",{active:!0,round:1,initiative:[],currentTurn:0,actionsUsed:{action:!1,bonus:!1,reaction:!1,movement:!1},zones:{front:{label:"Frontline"},back:{label:"Backline"},left:{label:"Left Flank"},right:{label:"Right Flank"},air:{label:"Air"},rear:{label:"Rear Guard"}}})},combat_end(n){p.campaign.location&&En.location_history(`${p.campaign.location}|Combat ended: ${n}`),g("campaign","combatState",{active:!1,round:0,initiative:[],currentTurn:0,actionsUsed:{action:!1,bonus:!1,reaction:!1,movement:!1},zones:{}})},zone_add_enemy(n){const[e,t,i,s,r]=n.split("|").map(a=>a.trim()),o=[...p.campaign.combatState.initiative,{name:e,roll:parseInt(r,10)||0,type:"npc",hp:parseInt(t,10)||0,hpMax:parseInt(t,10)||0,ac:parseInt(i,10)||10,zone:s||"front"}];o.sort((a,c)=>c.roll-a.roll),g("campaign","combatState","initiative",o),p.campaign.combatState.active||En.combat_start("")},zone_move(n){const[e,t]=n.split("|").map(s=>s.trim()),i=p.campaign.combatState.initiative.findIndex(s=>s.name.toLowerCase()===e.toLowerCase());i>=0&&g("campaign","combatState","initiative",i,"zone",t)},zone_remove(n){const e=n.trim().toLowerCase();g("campaign","combatState","initiative",p.campaign.combatState.initiative.filter(t=>t.name.toLowerCase()!==e))},zone_effect(n){const[e,t,i="terrain"]=n.split("|").map(s=>s.trim());g("campaign","combatState","zones",e,i,t)},zone_label(n){const[e,t]=n.split("|").map(i=>i.trim());g("campaign","combatState","zones",e,"label",t)},zone_fog(n){const[e,t]=n.split("|").map(i=>i.trim());g("campaign","combatState","zones",e,"hidden",t==="hide")},roll_request(n){const[e,t,i]=n.split("|").map(s=>s.trim());typeof window<"u"&&window.dispatchEvent(new CustomEvent("roll-request",{detail:{skill:e,dc:parseInt(t,10)||10,pcName:i}}))},death_save(n){const[e,t]=n.split("|").map(r=>r.trim()),i=re(e);if(i===-1)return;const s={...p.campaign.characters[i].deathSaves};t==="success"?s.successes=Math.min(3,s.successes+1):s.failures=Math.min(3,s.failures+1),g("campaign","characters",i,"deathSaves",s),s.successes>=3&&(g("campaign","characters",i,"hp",1),g("campaign","characters",i,"deathSaves",{successes:0,failures:0}))},module_episode(n){const[e,t]=n.split(",").map(r=>r.trim()),i=parseInt(e,10),s=p.campaign.moduleProgress.map((r,o)=>o<i-1&&r.status!=="complete"?{...r,status:"complete"}:o===i-1?{...r,status:t||"active"}:r);g("campaign","moduleProgress",s)},short_rest(){},save_game(){},save(){},none(){},shell_defense(){},sp_charge(){},wagon_add(){},wagon_cell_add(){},wagon_cell_update(){},wagon_cell_remove(){},wagon_hp(){},ox_hp(){},ox_condition(){},familiar_hp(){},animal_hp(){},animal_condition(){},spell_add(){},pc_update(){},pc_add(){},pc_delete(){}};function Nt(n,e){const t=p.campaign.gold[n];e.startsWith("+")||e.startsWith("-")?g("campaign","gold",n,Math.max(0,t+parseInt(e,10))):g("campaign","gold",n,Math.max(0,parseInt(e,10)||0))}function jl(n,e){const t=[];return n.length&&t.push("Applied: "+n.map(i=>`${i.key}: ${i.value}`).join(", ")),e.length&&t.push("Rejected: "+e.map(i=>`${i.key}: ${i.reason}`).join(", ")),t.length?`[MECHANICS RECEIPT] ${t.join(". ")}`:""}const zl=12e3,Gl=8e3,dr=4;async function Kl(n="narrative"){const e=p.campaign[n];if(!e||e.length<=dr||e.reduce((h,u)=>h+Hi(u.content||""),0)<=zl||e.filter(h=>h.role==="user"||h.role==="assistant").length<=dr)return;const s=[];let r=0,o=0;for(let h=e.length-1;h>=0;h--)if(r+=Hi(e[h].content||""),r>=Gl){o=h;break}if(o<=0)return;for(let h=0;h<o;h++)(e[h].role==="user"||e[h].role==="assistant")&&s.push(e[h]);if(s.length===0)return;const a=Yl(s),c=e.slice(o),l={role:"system",content:`[PRIOR CONTEXT SUMMARY]
${a}`,ts:Date.now(),isSummary:!0};g("campaign",n,[l,...c])}function Yl(n){const e=[];let t="";for(const i of n)if(i.role==="user")e.push(`Player: ${fr(i.content,80)}`);else if(i.role==="assistant"){const s=i.content.match(/Location:\s*(.+)/);if(s&&s[1]!==t&&(t=s[1].trim(),e.push(`Moved to: ${t}`)),i.mechReceipt)e.push(i.mechReceipt);else{const r=i.content.split(`
`)[0];e.push(`DM: ${fr(r,100)}`)}}return e.slice(-12).join(`
`)}function fr(n,e){return n?n.length>e?n.slice(0,e)+"...":n:""}let oe=null,Ft=!1;function pr(){return Ft}function Ql(){oe&&(oe.abort(),oe=null),Ft=!1}async function Jl(n,e={}){if(Ft)return;Ft=!0;const{tab:t="narrative",contextInject:i="",onChunk:s}=e;try{if(t==="ooc")return await Xl(n,s);const r={role:"user",content:n,ts:Date.now()};g("campaign","narrative",[...p.campaign.narrative,r]);const o=i,{prompt:a}=Ml(o);await Kl("narrative");const c=p.campaign.narrative.filter(f=>f.role==="user"||f.role==="assistant").map(f=>({role:f.role,content:f.content}));oe=new AbortController;const l=Bo(c,a,oe.signal);let h="";const u=p.campaign.narrative.length;g("campaign","narrative",[...p.campaign.narrative,{role:"assistant",content:"",ts:Date.now()}]);for await(const f of l)h+=f,g("campaign","narrative",u,"content",h),s&&s(f,h);oe=null;const d=Wl(h);if(d.length>0){const{valid:f,rejected:m}=Bl(d),v=Vl(f),E=jl(v.filter(N=>N.applied),m);E&&(g("campaign","narrative",u,"mechReceipt",E),g("campaign","narrative",u,"mechanics",{applied:v,rejected:m}))}return h}catch(r){if(r.name==="AbortError")return;const o={role:"system",content:`Error: ${r.message}`,ts:Date.now()};throw g("campaign","narrative",[...p.campaign.narrative,o]),r}finally{Ft=!1,oe=null}}async function Xl(n,e){const t={role:"user",content:n,ts:Date.now()};g("campaign","ooc",[...p.campaign.ooc,t]);const i=Tl,s=Fl(n),r=[...p.campaign.ooc.filter(l=>l.role==="user"||l.role==="assistant").slice(-6).map(l=>({role:l.role,content:l.content}))];r[r.length-1]={role:"user",content:s},oe=new AbortController;const o=Bo(r,i,oe.signal);let a="";const c=p.campaign.ooc.length;g("campaign","ooc",[...p.campaign.ooc,{role:"assistant",content:"",ts:Date.now()}]);for await(const l of o)a+=l,g("campaign","ooc",c,"content",a),e&&e(l,a);return oe=null,a}var Zl=se("<div class=input-bar><textarea class=input-field rows=1>"),eu=se("<button class=btn-stop>Stop"),tu=se("<button class=btn-send>Send");function nu(n){const[e,t]=Re("");let i;async function s(){const o=e().trim();!o||pr()||(t(""),i==null||i.focus(),await Jl(o,{tab:n.tab}))}function r(o){o.key==="Enter"&&!o.shiftKey&&(o.preventDefault(),s())}return(()=>{var o=Zl(),a=o.firstChild;a.$$keydown=r,a.$$input=l=>t(l.target.value);var c=i;return typeof c=="function"?Lo(c,a):i=a,Y(o,(()=>{var l=Do(()=>!!pr());return()=>l()?(()=>{var h=eu();return xo(h,"click",Ql),h})():(()=>{var h=tu();return h.$$click=s,ne(()=>h.disabled=!e().trim()),h})()})(),null),ne(()=>pl(a,"placeholder",n.tab==="ooc"?"Ask a rules question...":"What do you do?")),ne(()=>a.value=e()),o})()}oi(["input","keydown","click"]);var iu=se("<div class=chat-container><div class=chat-tabs><button>Narrative</button><button>Ask DM</button></div><div class=chat-messages><div>"),su=se("<div class=msg-summary-badge>Prior context"),ru=se("<div class=msg-receipt>"),ou=se("<div><div class=msg-content>");function au(){const[n,e]=Re("narrative");let t;const i=()=>{const s=n();return p.campaign[s]||[]};return tl(()=>{i(),setTimeout(()=>t==null?void 0:t.scrollIntoView({behavior:"smooth"}),50)}),(()=>{var s=iu(),r=s.firstChild,o=r.firstChild,a=o.nextSibling,c=r.nextSibling,l=c.firstChild;o.$$click=()=>e("narrative"),a.$$click=()=>e("ooc"),Y(c,X(hl,{get each(){return i()},children:u=>(()=>{var d=ou(),f=d.firstChild;return Y(d,X(rt,{get when(){return u.isSummary},get children(){return su()}}),f),Y(d,X(rt,{get when(){return u.mechReceipt},get children(){var m=ru();return Y(m,()=>u.mechReceipt),m}}),null),ne(m=>{var v=`msg msg-${u.role}`,E=cu(u.content);return v!==m.e&&Ci(d,m.e=v),E!==m.t&&(f.innerHTML=m.t=E),m},{e:void 0,t:void 0}),d})()}),l);var h=t;return typeof h=="function"?Lo(h,l):t=l,Y(s,X(nu,{get tab(){return n()}}),null),ne(u=>{var d=n()==="narrative"?"tab active":"tab",f=n()==="ooc"?"tab active":"tab";return d!==u.e&&Ci(o,u.e=d),f!==u.t&&Ci(a,u.t=f),u},{e:void 0,t:void 0}),s})()}function cu(n){if(!n)return"";let e=n.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");return e=e.replace(/\*\*\*\n?/g,'<hr class="campaign-break">'),e=e.replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*(.+?)\*/g,"<em>$1</em>"),e=e.replace(/\n/g,"<br>"),e}oi(["click"]);var lu=se("<div class=settings-page><h2 class=settings-heading>Settings</h2><section class=settings-section><h3 class=settings-label>AI Provider Keys</h3><div class=field-group><label class=field-label>Gemini API Key</label><input type=password class=field-input placeholder=AIza...></div><div class=field-group><label class=field-label>OpenRouter Key (optional fallback)</label><input type=password class=field-input placeholder=sk-or-...></div><button class=btn-save></button></section><section class=settings-section><h3 class=settings-label>Theme</h3><div class=theme-controls><button class=btn-theme></button><button class=btn-theme>Next Palette</button><span class=theme-current>");function uu(){const[n,e]=Re(p.system.providers.geminiKey),[t,i]=Re(p.system.providers.openrouterKey),[s,r]=Re(!1);function o(){g("system","providers","geminiKey",n().trim()),g("system","providers","openrouterKey",t().trim()),r(!0),setTimeout(()=>r(!1),2e3)}function a(){const l=p.system.settings.theme,[h,u]=l.split("-"),d=parseInt(u,10),f=d>=9?`${h}-0`:`${h}-${d+1}`;g("system","settings","theme",f),document.documentElement.setAttribute("data-theme",f)}function c(){const l=p.system.settings.theme,[h,u]=l.split("-"),d=h==="dark"?`light-${u}`:`dark-${u}`;g("system","settings","theme",d),document.documentElement.setAttribute("data-theme",d)}return(()=>{var l=lu(),h=l.firstChild,u=h.nextSibling,d=u.firstChild,f=d.nextSibling,m=f.firstChild,v=m.nextSibling,E=f.nextSibling,N=E.firstChild,P=N.nextSibling,O=E.nextSibling,L=u.nextSibling,J=L.firstChild,Be=J.nextSibling,tt=Be.firstChild,fn=tt.nextSibling,At=fn.nextSibling;return v.$$input=Rt=>e(Rt.target.value),P.$$input=Rt=>i(Rt.target.value),O.$$click=o,Y(O,()=>s()?"Saved":"Save Keys"),tt.$$click=c,Y(tt,()=>p.system.settings.theme.startsWith("dark")?"Light":"Dark"),fn.$$click=a,Y(At,()=>p.system.settings.theme),ne(()=>v.value=n()),ne(()=>P.value=t()),l})()}oi(["input","click"]);var hu=se("<div class=mode-placeholder><p> mode"),du=se("<div class=app-shell><main class=app-content></main><nav class=bottom-nav><button class=nav-item>Play</button><button class=nav-item>Cargo</button><button class=nav-item>Settings"),fu=se("<div class=no-campaign><p>No campaign found.</p><button class=btn-demo>Load Demo Campaign</button><p style=color:var(--color-text-muted);font-size:var(--font-size-sm)>Setup mode coming soon.");function pu(){const[n,e]=Re("play"),t=()=>p.campaign.id!=="";return(()=>{var i=du(),s=i.firstChild,r=s.nextSibling,o=r.firstChild,a=o.nextSibling,c=a.nextSibling;return Y(s,X(rt,{get when(){return t()},get fallback(){return(()=>{var l=fu(),h=l.firstChild,u=h.nextSibling;return u.nextSibling,xo(u,"click",Cl),l})()},get children(){return[X(rt,{get when(){return n()==="play"},get children(){return X(au,{})}}),X(rt,{get when(){return n()==="manage"},get children(){return X(uu,{})}}),X(rt,{get when(){return Do(()=>n()!=="play")()&&n()!=="manage"},get children(){var l=hu(),h=l.firstChild,u=h.firstChild;return Y(h,n,u),l}})]}})),o.$$click=()=>e("play"),a.$$click=()=>e("reference"),c.$$click=()=>e("manage"),ne(l=>{var h=n()==="play",u=n()==="reference",d=n()==="manage";return h!==l.e&&o.classList.toggle("active",l.e=h),u!==l.t&&a.classList.toggle("active",l.t=u),d!==l.a&&c.classList.toggle("active",l.a=d),l},{e:void 0,t:void 0,a:void 0}),i})()}oi(["click"]);var mr={};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Vo={NODE_ADMIN:!1,SDK_VERSION:"${JSCORE_VERSION}"};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _=function(n,e){if(!n)throw Et(e)},Et=function(n){return new Error("Firebase Database ("+Vo.SDK_VERSION+") INTERNAL ASSERT FAILED: "+n)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const qo=function(n){const e=[];let t=0;for(let i=0;i<n.length;i++){let s=n.charCodeAt(i);s<128?e[t++]=s:s<2048?(e[t++]=s>>6|192,e[t++]=s&63|128):(s&64512)===55296&&i+1<n.length&&(n.charCodeAt(i+1)&64512)===56320?(s=65536+((s&1023)<<10)+(n.charCodeAt(++i)&1023),e[t++]=s>>18|240,e[t++]=s>>12&63|128,e[t++]=s>>6&63|128,e[t++]=s&63|128):(e[t++]=s>>12|224,e[t++]=s>>6&63|128,e[t++]=s&63|128)}return e},mu=function(n){const e=[];let t=0,i=0;for(;t<n.length;){const s=n[t++];if(s<128)e[i++]=String.fromCharCode(s);else if(s>191&&s<224){const r=n[t++];e[i++]=String.fromCharCode((s&31)<<6|r&63)}else if(s>239&&s<365){const r=n[t++],o=n[t++],a=n[t++],c=((s&7)<<18|(r&63)<<12|(o&63)<<6|a&63)-65536;e[i++]=String.fromCharCode(55296+(c>>10)),e[i++]=String.fromCharCode(56320+(c&1023))}else{const r=n[t++],o=n[t++];e[i++]=String.fromCharCode((s&15)<<12|(r&63)<<6|o&63)}}return e.join("")},fs={byteToCharMap_:null,charToByteMap_:null,byteToCharMapWebSafe_:null,charToByteMapWebSafe_:null,ENCODED_VALS_BASE:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",get ENCODED_VALS(){return this.ENCODED_VALS_BASE+"+/="},get ENCODED_VALS_WEBSAFE(){return this.ENCODED_VALS_BASE+"-_."},HAS_NATIVE_SUPPORT:typeof atob=="function",encodeByteArray(n,e){if(!Array.isArray(n))throw Error("encodeByteArray takes an array as a parameter");this.init_();const t=e?this.byteToCharMapWebSafe_:this.byteToCharMap_,i=[];for(let s=0;s<n.length;s+=3){const r=n[s],o=s+1<n.length,a=o?n[s+1]:0,c=s+2<n.length,l=c?n[s+2]:0,h=r>>2,u=(r&3)<<4|a>>4;let d=(a&15)<<2|l>>6,f=l&63;c||(f=64,o||(d=64)),i.push(t[h],t[u],t[d],t[f])}return i.join("")},encodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?btoa(n):this.encodeByteArray(qo(n),e)},decodeString(n,e){return this.HAS_NATIVE_SUPPORT&&!e?atob(n):mu(this.decodeStringToByteArray(n,e))},decodeStringToByteArray(n,e){this.init_();const t=e?this.charToByteMapWebSafe_:this.charToByteMap_,i=[];for(let s=0;s<n.length;){const r=t[n.charAt(s++)],a=s<n.length?t[n.charAt(s)]:0;++s;const l=s<n.length?t[n.charAt(s)]:64;++s;const u=s<n.length?t[n.charAt(s)]:64;if(++s,r==null||a==null||l==null||u==null)throw new _u;const d=r<<2|a>>4;if(i.push(d),l!==64){const f=a<<4&240|l>>2;if(i.push(f),u!==64){const m=l<<6&192|u;i.push(m)}}}return i},init_(){if(!this.byteToCharMap_){this.byteToCharMap_={},this.charToByteMap_={},this.byteToCharMapWebSafe_={},this.charToByteMapWebSafe_={};for(let n=0;n<this.ENCODED_VALS.length;n++)this.byteToCharMap_[n]=this.ENCODED_VALS.charAt(n),this.charToByteMap_[this.byteToCharMap_[n]]=n,this.byteToCharMapWebSafe_[n]=this.ENCODED_VALS_WEBSAFE.charAt(n),this.charToByteMapWebSafe_[this.byteToCharMapWebSafe_[n]]=n,n>=this.ENCODED_VALS_BASE.length&&(this.charToByteMap_[this.ENCODED_VALS_WEBSAFE.charAt(n)]=n,this.charToByteMapWebSafe_[this.ENCODED_VALS.charAt(n)]=n)}}};class _u extends Error{constructor(){super(...arguments),this.name="DecodeBase64StringError"}}const jo=function(n){const e=qo(n);return fs.encodeByteArray(e,!0)},Mn=function(n){return jo(n).replace(/\./g,"")},Fn=function(n){try{return fs.decodeString(n,!0)}catch(e){console.error("base64Decode failed: ",e)}return null};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function gu(n){return zo(void 0,n)}function zo(n,e){if(!(e instanceof Object))return e;switch(e.constructor){case Date:const t=e;return new Date(t.getTime());case Object:n===void 0&&(n={});break;case Array:n=[];break;default:return e}for(const t in e)!e.hasOwnProperty(t)||!vu(t)||(n[t]=zo(n[t],e[t]));return n}function vu(n){return n!=="__proto__"}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function yu(){if(typeof self<"u")return self;if(typeof window<"u")return window;if(typeof global<"u")return global;throw new Error("Unable to locate global object.")}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const wu=()=>yu().__FIREBASE_DEFAULTS__,Eu=()=>{if(typeof process>"u"||typeof mr>"u")return;const n=mr.__FIREBASE_DEFAULTS__;if(n)return JSON.parse(n)},Iu=()=>{if(typeof document>"u")return;let n;try{n=document.cookie.match(/__FIREBASE_DEFAULTS__=([^;]+)/)}catch{return}const e=n&&Fn(n[1]);return e&&JSON.parse(e)},ps=()=>{try{return wu()||Eu()||Iu()}catch(n){console.info(`Unable to get __FIREBASE_DEFAULTS__ due to: ${n}`);return}},Go=n=>{var e,t;return(t=(e=ps())===null||e===void 0?void 0:e.emulatorHosts)===null||t===void 0?void 0:t[n]},Cu=n=>{const e=Go(n);if(!e)return;const t=e.lastIndexOf(":");if(t<=0||t+1===e.length)throw new Error(`Invalid host ${e} with no separate hostname and port!`);const i=parseInt(e.substring(t+1),10);return e[0]==="["?[e.substring(1,t-1),i]:[e.substring(0,t),i]},Ko=()=>{var n;return(n=ps())===null||n===void 0?void 0:n.config},Yo=n=>{var e;return(e=ps())===null||e===void 0?void 0:e[`_${n}`]};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ai{constructor(){this.reject=()=>{},this.resolve=()=>{},this.promise=new Promise((e,t)=>{this.resolve=e,this.reject=t})}wrapCallback(e){return(t,i)=>{t?this.reject(t):this.resolve(i),typeof e=="function"&&(this.promise.catch(()=>{}),e.length===1?e(t):e(t,i))}}}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function bu(n,e){if(n.uid)throw new Error('The "uid" field is no longer supported by mockUserToken. Please use "sub" instead for Firebase Auth User ID.');const t={alg:"none",type:"JWT"},i=e||"demo-project",s=n.iat||0,r=n.sub||n.user_id;if(!r)throw new Error("mockUserToken must contain 'sub' or 'user_id' field!");const o=Object.assign({iss:`https://securetoken.google.com/${i}`,aud:i,iat:s,exp:s+3600,auth_time:s,sub:r,user_id:r,firebase:{sign_in_provider:"custom",identities:{}}},n);return[Mn(JSON.stringify(t)),Mn(JSON.stringify(o)),""].join(".")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function q(){return typeof navigator<"u"&&typeof navigator.userAgent=="string"?navigator.userAgent:""}function ms(){return typeof window<"u"&&!!(window.cordova||window.phonegap||window.PhoneGap)&&/ios|iphone|ipod|ipad|android|blackberry|iemobile/i.test(q())}function Su(){return typeof navigator<"u"&&navigator.userAgent==="Cloudflare-Workers"}function Tu(){const n=typeof chrome=="object"?chrome.runtime:typeof browser=="object"?browser.runtime:void 0;return typeof n=="object"&&n.id!==void 0}function Qo(){return typeof navigator=="object"&&navigator.product==="ReactNative"}function ku(){const n=q();return n.indexOf("MSIE ")>=0||n.indexOf("Trident/")>=0}function Au(){return Vo.NODE_ADMIN===!0}function Ru(){try{return typeof indexedDB=="object"}catch{return!1}}function Nu(){return new Promise((n,e)=>{try{let t=!0;const i="validate-browser-context-for-indexeddb-analytics-module",s=self.indexedDB.open(i);s.onsuccess=()=>{s.result.close(),t||self.indexedDB.deleteDatabase(i),n(!0)},s.onupgradeneeded=()=>{t=!1},s.onerror=()=>{var r;e(((r=s.error)===null||r===void 0?void 0:r.message)||"")}}catch(t){e(t)}})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pu="FirebaseError";class $e extends Error{constructor(e,t,i){super(t),this.code=e,this.customData=i,this.name=Pu,Object.setPrototypeOf(this,$e.prototype),Error.captureStackTrace&&Error.captureStackTrace(this,sn.prototype.create)}}class sn{constructor(e,t,i){this.service=e,this.serviceName=t,this.errors=i}create(e,...t){const i=t[0]||{},s=`${this.service}/${e}`,r=this.errors[e],o=r?Ou(r,i):"Error",a=`${this.serviceName}: ${o} (${s}).`;return new $e(s,a,i)}}function Ou(n,e){return n.replace(Du,(t,i)=>{const s=e[i];return s!=null?String(s):`<${i}?>`})}const Du=/\{\$([^}]+)}/g;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gt(n){return JSON.parse(n)}function W(n){return JSON.stringify(n)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Jo=function(n){let e={},t={},i={},s="";try{const r=n.split(".");e=Gt(Fn(r[0])||""),t=Gt(Fn(r[1])||""),s=r[2],i=t.d||{},delete t.d}catch{}return{header:e,claims:t,data:i,signature:s}},xu=function(n){const e=Jo(n),t=e.claims;return!!t&&typeof t=="object"&&t.hasOwnProperty("iat")},Lu=function(n){const e=Jo(n).claims;return typeof e=="object"&&e.admin===!0};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ie(n,e){return Object.prototype.hasOwnProperty.call(n,e)}function mt(n,e){if(Object.prototype.hasOwnProperty.call(n,e))return n[e]}function Vi(n){for(const e in n)if(Object.prototype.hasOwnProperty.call(n,e))return!1;return!0}function Un(n,e,t){const i={};for(const s in n)Object.prototype.hasOwnProperty.call(n,s)&&(i[s]=e.call(t,n[s],s,n));return i}function $n(n,e){if(n===e)return!0;const t=Object.keys(n),i=Object.keys(e);for(const s of t){if(!i.includes(s))return!1;const r=n[s],o=e[s];if(_r(r)&&_r(o)){if(!$n(r,o))return!1}else if(r!==o)return!1}for(const s of i)if(!t.includes(s))return!1;return!0}function _r(n){return n!==null&&typeof n=="object"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function It(n){const e=[];for(const[t,i]of Object.entries(n))Array.isArray(i)?i.forEach(s=>{e.push(encodeURIComponent(t)+"="+encodeURIComponent(s))}):e.push(encodeURIComponent(t)+"="+encodeURIComponent(i));return e.length?"&"+e.join("&"):""}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Mu{constructor(){this.chain_=[],this.buf_=[],this.W_=[],this.pad_=[],this.inbuf_=0,this.total_=0,this.blockSize=512/8,this.pad_[0]=128;for(let e=1;e<this.blockSize;++e)this.pad_[e]=0;this.reset()}reset(){this.chain_[0]=1732584193,this.chain_[1]=4023233417,this.chain_[2]=2562383102,this.chain_[3]=271733878,this.chain_[4]=3285377520,this.inbuf_=0,this.total_=0}compress_(e,t){t||(t=0);const i=this.W_;if(typeof e=="string")for(let u=0;u<16;u++)i[u]=e.charCodeAt(t)<<24|e.charCodeAt(t+1)<<16|e.charCodeAt(t+2)<<8|e.charCodeAt(t+3),t+=4;else for(let u=0;u<16;u++)i[u]=e[t]<<24|e[t+1]<<16|e[t+2]<<8|e[t+3],t+=4;for(let u=16;u<80;u++){const d=i[u-3]^i[u-8]^i[u-14]^i[u-16];i[u]=(d<<1|d>>>31)&4294967295}let s=this.chain_[0],r=this.chain_[1],o=this.chain_[2],a=this.chain_[3],c=this.chain_[4],l,h;for(let u=0;u<80;u++){u<40?u<20?(l=a^r&(o^a),h=1518500249):(l=r^o^a,h=1859775393):u<60?(l=r&o|a&(r|o),h=2400959708):(l=r^o^a,h=3395469782);const d=(s<<5|s>>>27)+l+c+h+i[u]&4294967295;c=a,a=o,o=(r<<30|r>>>2)&4294967295,r=s,s=d}this.chain_[0]=this.chain_[0]+s&4294967295,this.chain_[1]=this.chain_[1]+r&4294967295,this.chain_[2]=this.chain_[2]+o&4294967295,this.chain_[3]=this.chain_[3]+a&4294967295,this.chain_[4]=this.chain_[4]+c&4294967295}update(e,t){if(e==null)return;t===void 0&&(t=e.length);const i=t-this.blockSize;let s=0;const r=this.buf_;let o=this.inbuf_;for(;s<t;){if(o===0)for(;s<=i;)this.compress_(e,s),s+=this.blockSize;if(typeof e=="string"){for(;s<t;)if(r[o]=e.charCodeAt(s),++o,++s,o===this.blockSize){this.compress_(r),o=0;break}}else for(;s<t;)if(r[o]=e[s],++o,++s,o===this.blockSize){this.compress_(r),o=0;break}}this.inbuf_=o,this.total_+=t}digest(){const e=[];let t=this.total_*8;this.inbuf_<56?this.update(this.pad_,56-this.inbuf_):this.update(this.pad_,this.blockSize-(this.inbuf_-56));for(let s=this.blockSize-1;s>=56;s--)this.buf_[s]=t&255,t/=256;this.compress_(this.buf_);let i=0;for(let s=0;s<5;s++)for(let r=24;r>=0;r-=8)e[i]=this.chain_[s]>>r&255,++i;return e}}function Fu(n,e){const t=new Uu(n,e);return t.subscribe.bind(t)}class Uu{constructor(e,t){this.observers=[],this.unsubscribes=[],this.observerCount=0,this.task=Promise.resolve(),this.finalized=!1,this.onNoObservers=t,this.task.then(()=>{e(this)}).catch(i=>{this.error(i)})}next(e){this.forEachObserver(t=>{t.next(e)})}error(e){this.forEachObserver(t=>{t.error(e)}),this.close(e)}complete(){this.forEachObserver(e=>{e.complete()}),this.close()}subscribe(e,t,i){let s;if(e===void 0&&t===void 0&&i===void 0)throw new Error("Missing Observer.");$u(e,["next","error","complete"])?s=e:s={next:e,error:t,complete:i},s.next===void 0&&(s.next=bi),s.error===void 0&&(s.error=bi),s.complete===void 0&&(s.complete=bi);const r=this.unsubscribeOne.bind(this,this.observers.length);return this.finalized&&this.task.then(()=>{try{this.finalError?s.error(this.finalError):s.complete()}catch{}}),this.observers.push(s),r}unsubscribeOne(e){this.observers===void 0||this.observers[e]===void 0||(delete this.observers[e],this.observerCount-=1,this.observerCount===0&&this.onNoObservers!==void 0&&this.onNoObservers(this))}forEachObserver(e){if(!this.finalized)for(let t=0;t<this.observers.length;t++)this.sendOne(t,e)}sendOne(e,t){this.task.then(()=>{if(this.observers!==void 0&&this.observers[e]!==void 0)try{t(this.observers[e])}catch(i){typeof console<"u"&&console.error&&console.error(i)}})}close(e){this.finalized||(this.finalized=!0,e!==void 0&&(this.finalError=e),this.task.then(()=>{this.observers=void 0,this.onNoObservers=void 0}))}}function $u(n,e){if(typeof n!="object"||n===null)return!1;for(const t of e)if(t in n&&typeof n[t]=="function")return!0;return!1}function bi(){}function _s(n,e){return`${n} failed: ${e} argument `}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Wu=function(n){const e=[];let t=0;for(let i=0;i<n.length;i++){let s=n.charCodeAt(i);if(s>=55296&&s<=56319){const r=s-55296;i++,_(i<n.length,"Surrogate pair missing trail surrogate.");const o=n.charCodeAt(i)-56320;s=65536+(r<<10)+o}s<128?e[t++]=s:s<2048?(e[t++]=s>>6|192,e[t++]=s&63|128):s<65536?(e[t++]=s>>12|224,e[t++]=s>>6&63|128,e[t++]=s&63|128):(e[t++]=s>>18|240,e[t++]=s>>12&63|128,e[t++]=s>>6&63|128,e[t++]=s&63|128)}return e},ci=function(n){let e=0;for(let t=0;t<n.length;t++){const i=n.charCodeAt(t);i<128?e++:i<2048?e+=2:i>=55296&&i<=56319?(e+=4,t++):e+=3}return e};/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Q(n){return n&&n._delegate?n._delegate:n}class Ke{constructor(e,t,i){this.name=e,this.instanceFactory=t,this.type=i,this.multipleInstances=!1,this.serviceProps={},this.instantiationMode="LAZY",this.onInstanceCreated=null}setInstantiationMode(e){return this.instantiationMode=e,this}setMultipleInstances(e){return this.multipleInstances=e,this}setServiceProps(e){return this.serviceProps=e,this}setInstanceCreatedCallback(e){return this.onInstanceCreated=e,this}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const He="[DEFAULT]";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bu{constructor(e,t){this.name=e,this.container=t,this.component=null,this.instances=new Map,this.instancesDeferred=new Map,this.instancesOptions=new Map,this.onInitCallbacks=new Map}get(e){const t=this.normalizeInstanceIdentifier(e);if(!this.instancesDeferred.has(t)){const i=new ai;if(this.instancesDeferred.set(t,i),this.isInitialized(t)||this.shouldAutoInitialize())try{const s=this.getOrInitializeService({instanceIdentifier:t});s&&i.resolve(s)}catch{}}return this.instancesDeferred.get(t).promise}getImmediate(e){var t;const i=this.normalizeInstanceIdentifier(e==null?void 0:e.identifier),s=(t=e==null?void 0:e.optional)!==null&&t!==void 0?t:!1;if(this.isInitialized(i)||this.shouldAutoInitialize())try{return this.getOrInitializeService({instanceIdentifier:i})}catch(r){if(s)return null;throw r}else{if(s)return null;throw Error(`Service ${this.name} is not available`)}}getComponent(){return this.component}setComponent(e){if(e.name!==this.name)throw Error(`Mismatching Component ${e.name} for Provider ${this.name}.`);if(this.component)throw Error(`Component for ${this.name} has already been provided`);if(this.component=e,!!this.shouldAutoInitialize()){if(Vu(e))try{this.getOrInitializeService({instanceIdentifier:He})}catch{}for(const[t,i]of this.instancesDeferred.entries()){const s=this.normalizeInstanceIdentifier(t);try{const r=this.getOrInitializeService({instanceIdentifier:s});i.resolve(r)}catch{}}}}clearInstance(e=He){this.instancesDeferred.delete(e),this.instancesOptions.delete(e),this.instances.delete(e)}async delete(){const e=Array.from(this.instances.values());await Promise.all([...e.filter(t=>"INTERNAL"in t).map(t=>t.INTERNAL.delete()),...e.filter(t=>"_delete"in t).map(t=>t._delete())])}isComponentSet(){return this.component!=null}isInitialized(e=He){return this.instances.has(e)}getOptions(e=He){return this.instancesOptions.get(e)||{}}initialize(e={}){const{options:t={}}=e,i=this.normalizeInstanceIdentifier(e.instanceIdentifier);if(this.isInitialized(i))throw Error(`${this.name}(${i}) has already been initialized`);if(!this.isComponentSet())throw Error(`Component ${this.name} has not been registered yet`);const s=this.getOrInitializeService({instanceIdentifier:i,options:t});for(const[r,o]of this.instancesDeferred.entries()){const a=this.normalizeInstanceIdentifier(r);i===a&&o.resolve(s)}return s}onInit(e,t){var i;const s=this.normalizeInstanceIdentifier(t),r=(i=this.onInitCallbacks.get(s))!==null&&i!==void 0?i:new Set;r.add(e),this.onInitCallbacks.set(s,r);const o=this.instances.get(s);return o&&e(o,s),()=>{r.delete(e)}}invokeOnInitCallbacks(e,t){const i=this.onInitCallbacks.get(t);if(i)for(const s of i)try{s(e,t)}catch{}}getOrInitializeService({instanceIdentifier:e,options:t={}}){let i=this.instances.get(e);if(!i&&this.component&&(i=this.component.instanceFactory(this.container,{instanceIdentifier:Hu(e),options:t}),this.instances.set(e,i),this.instancesOptions.set(e,t),this.invokeOnInitCallbacks(i,e),this.component.onInstanceCreated))try{this.component.onInstanceCreated(this.container,e,i)}catch{}return i||null}normalizeInstanceIdentifier(e=He){return this.component?this.component.multipleInstances?e:He:e}shouldAutoInitialize(){return!!this.component&&this.component.instantiationMode!=="EXPLICIT"}}function Hu(n){return n===He?void 0:n}function Vu(n){return n.instantiationMode==="EAGER"}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class qu{constructor(e){this.name=e,this.providers=new Map}addComponent(e){const t=this.getProvider(e.name);if(t.isComponentSet())throw new Error(`Component ${e.name} has already been registered with ${this.name}`);t.setComponent(e)}addOrOverwriteComponent(e){this.getProvider(e.name).isComponentSet()&&this.providers.delete(e.name),this.addComponent(e)}getProvider(e){if(this.providers.has(e))return this.providers.get(e);const t=new Bu(e,this);return this.providers.set(e,t),t}getProviders(){return Array.from(this.providers.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var T;(function(n){n[n.DEBUG=0]="DEBUG",n[n.VERBOSE=1]="VERBOSE",n[n.INFO=2]="INFO",n[n.WARN=3]="WARN",n[n.ERROR=4]="ERROR",n[n.SILENT=5]="SILENT"})(T||(T={}));const ju={debug:T.DEBUG,verbose:T.VERBOSE,info:T.INFO,warn:T.WARN,error:T.ERROR,silent:T.SILENT},zu=T.INFO,Gu={[T.DEBUG]:"log",[T.VERBOSE]:"log",[T.INFO]:"info",[T.WARN]:"warn",[T.ERROR]:"error"},Ku=(n,e,...t)=>{if(e<n.logLevel)return;const i=new Date().toISOString(),s=Gu[e];if(s)console[s](`[${i}]  ${n.name}:`,...t);else throw new Error(`Attempted to log a message with an invalid logType (value: ${e})`)};class gs{constructor(e){this.name=e,this._logLevel=zu,this._logHandler=Ku,this._userLogHandler=null}get logLevel(){return this._logLevel}set logLevel(e){if(!(e in T))throw new TypeError(`Invalid value "${e}" assigned to \`logLevel\``);this._logLevel=e}setLogLevel(e){this._logLevel=typeof e=="string"?ju[e]:e}get logHandler(){return this._logHandler}set logHandler(e){if(typeof e!="function")throw new TypeError("Value assigned to `logHandler` must be a function");this._logHandler=e}get userLogHandler(){return this._userLogHandler}set userLogHandler(e){this._userLogHandler=e}debug(...e){this._userLogHandler&&this._userLogHandler(this,T.DEBUG,...e),this._logHandler(this,T.DEBUG,...e)}log(...e){this._userLogHandler&&this._userLogHandler(this,T.VERBOSE,...e),this._logHandler(this,T.VERBOSE,...e)}info(...e){this._userLogHandler&&this._userLogHandler(this,T.INFO,...e),this._logHandler(this,T.INFO,...e)}warn(...e){this._userLogHandler&&this._userLogHandler(this,T.WARN,...e),this._logHandler(this,T.WARN,...e)}error(...e){this._userLogHandler&&this._userLogHandler(this,T.ERROR,...e),this._logHandler(this,T.ERROR,...e)}}const Yu=(n,e)=>e.some(t=>n instanceof t);let gr,vr;function Qu(){return gr||(gr=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])}function Ju(){return vr||(vr=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])}const Xo=new WeakMap,qi=new WeakMap,Zo=new WeakMap,Si=new WeakMap,vs=new WeakMap;function Xu(n){const e=new Promise((t,i)=>{const s=()=>{n.removeEventListener("success",r),n.removeEventListener("error",o)},r=()=>{t(Ne(n.result)),s()},o=()=>{i(n.error),s()};n.addEventListener("success",r),n.addEventListener("error",o)});return e.then(t=>{t instanceof IDBCursor&&Xo.set(t,n)}).catch(()=>{}),vs.set(e,n),e}function Zu(n){if(qi.has(n))return;const e=new Promise((t,i)=>{const s=()=>{n.removeEventListener("complete",r),n.removeEventListener("error",o),n.removeEventListener("abort",o)},r=()=>{t(),s()},o=()=>{i(n.error||new DOMException("AbortError","AbortError")),s()};n.addEventListener("complete",r),n.addEventListener("error",o),n.addEventListener("abort",o)});qi.set(n,e)}let ji={get(n,e,t){if(n instanceof IDBTransaction){if(e==="done")return qi.get(n);if(e==="objectStoreNames")return n.objectStoreNames||Zo.get(n);if(e==="store")return t.objectStoreNames[1]?void 0:t.objectStore(t.objectStoreNames[0])}return Ne(n[e])},set(n,e,t){return n[e]=t,!0},has(n,e){return n instanceof IDBTransaction&&(e==="done"||e==="store")?!0:e in n}};function eh(n){ji=n(ji)}function th(n){return n===IDBDatabase.prototype.transaction&&!("objectStoreNames"in IDBTransaction.prototype)?function(e,...t){const i=n.call(Ti(this),e,...t);return Zo.set(i,e.sort?e.sort():[e]),Ne(i)}:Ju().includes(n)?function(...e){return n.apply(Ti(this),e),Ne(Xo.get(this))}:function(...e){return Ne(n.apply(Ti(this),e))}}function nh(n){return typeof n=="function"?th(n):(n instanceof IDBTransaction&&Zu(n),Yu(n,Qu())?new Proxy(n,ji):n)}function Ne(n){if(n instanceof IDBRequest)return Xu(n);if(Si.has(n))return Si.get(n);const e=nh(n);return e!==n&&(Si.set(n,e),vs.set(e,n)),e}const Ti=n=>vs.get(n);function ih(n,e,{blocked:t,upgrade:i,blocking:s,terminated:r}={}){const o=indexedDB.open(n,e),a=Ne(o);return i&&o.addEventListener("upgradeneeded",c=>{i(Ne(o.result),c.oldVersion,c.newVersion,Ne(o.transaction),c)}),t&&o.addEventListener("blocked",c=>t(c.oldVersion,c.newVersion,c)),a.then(c=>{r&&c.addEventListener("close",()=>r()),s&&c.addEventListener("versionchange",l=>s(l.oldVersion,l.newVersion,l))}).catch(()=>{}),a}const sh=["get","getKey","getAll","getAllKeys","count"],rh=["put","add","delete","clear"],ki=new Map;function yr(n,e){if(!(n instanceof IDBDatabase&&!(e in n)&&typeof e=="string"))return;if(ki.get(e))return ki.get(e);const t=e.replace(/FromIndex$/,""),i=e!==t,s=rh.includes(t);if(!(t in(i?IDBIndex:IDBObjectStore).prototype)||!(s||sh.includes(t)))return;const r=async function(o,...a){const c=this.transaction(o,s?"readwrite":"readonly");let l=c.store;return i&&(l=l.index(a.shift())),(await Promise.all([l[t](...a),s&&c.done]))[0]};return ki.set(e,r),r}eh(n=>({...n,get:(e,t,i)=>yr(e,t)||n.get(e,t,i),has:(e,t)=>!!yr(e,t)||n.has(e,t)}));/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class oh{constructor(e){this.container=e}getPlatformInfoString(){return this.container.getProviders().map(t=>{if(ah(t)){const i=t.getImmediate();return`${i.library}/${i.version}`}else return null}).filter(t=>t).join(" ")}}function ah(n){const e=n.getComponent();return(e==null?void 0:e.type)==="VERSION"}const zi="@firebase/app",wr="0.10.13";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ge=new gs("@firebase/app"),ch="@firebase/app-compat",lh="@firebase/analytics-compat",uh="@firebase/analytics",hh="@firebase/app-check-compat",dh="@firebase/app-check",fh="@firebase/auth",ph="@firebase/auth-compat",mh="@firebase/database",_h="@firebase/data-connect",gh="@firebase/database-compat",vh="@firebase/functions",yh="@firebase/functions-compat",wh="@firebase/installations",Eh="@firebase/installations-compat",Ih="@firebase/messaging",Ch="@firebase/messaging-compat",bh="@firebase/performance",Sh="@firebase/performance-compat",Th="@firebase/remote-config",kh="@firebase/remote-config-compat",Ah="@firebase/storage",Rh="@firebase/storage-compat",Nh="@firebase/firestore",Ph="@firebase/vertexai-preview",Oh="@firebase/firestore-compat",Dh="firebase",xh="10.14.1";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Gi="[DEFAULT]",Lh={[zi]:"fire-core",[ch]:"fire-core-compat",[uh]:"fire-analytics",[lh]:"fire-analytics-compat",[dh]:"fire-app-check",[hh]:"fire-app-check-compat",[fh]:"fire-auth",[ph]:"fire-auth-compat",[mh]:"fire-rtdb",[_h]:"fire-data-connect",[gh]:"fire-rtdb-compat",[vh]:"fire-fn",[yh]:"fire-fn-compat",[wh]:"fire-iid",[Eh]:"fire-iid-compat",[Ih]:"fire-fcm",[Ch]:"fire-fcm-compat",[bh]:"fire-perf",[Sh]:"fire-perf-compat",[Th]:"fire-rc",[kh]:"fire-rc-compat",[Ah]:"fire-gcs",[Rh]:"fire-gcs-compat",[Nh]:"fire-fst",[Oh]:"fire-fst-compat",[Ph]:"fire-vertex","fire-js":"fire-js",[Dh]:"fire-js-all"};/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Wn=new Map,Mh=new Map,Ki=new Map;function Er(n,e){try{n.container.addComponent(e)}catch(t){ge.debug(`Component ${e.name} failed to register with FirebaseApp ${n.name}`,t)}}function _t(n){const e=n.name;if(Ki.has(e))return ge.debug(`There were multiple attempts to register component ${e}.`),!1;Ki.set(e,n);for(const t of Wn.values())Er(t,n);for(const t of Mh.values())Er(t,n);return!0}function ys(n,e){const t=n.container.getProvider("heartbeat").getImmediate({optional:!0});return t&&t.triggerHeartbeat(),n.container.getProvider(e)}function ue(n){return n.settings!==void 0}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fh={"no-app":"No Firebase App '{$appName}' has been created - call initializeApp() first","bad-app-name":"Illegal App name: '{$appName}'","duplicate-app":"Firebase App named '{$appName}' already exists with different options or config","app-deleted":"Firebase App named '{$appName}' already deleted","server-app-deleted":"Firebase Server App has been deleted","no-options":"Need to provide options, when not being deployed to hosting via source.","invalid-app-argument":"firebase.{$appName}() takes either no argument or a Firebase App instance.","invalid-log-argument":"First argument to `onLog` must be null or a function.","idb-open":"Error thrown when opening IndexedDB. Original error: {$originalErrorMessage}.","idb-get":"Error thrown when reading from IndexedDB. Original error: {$originalErrorMessage}.","idb-set":"Error thrown when writing to IndexedDB. Original error: {$originalErrorMessage}.","idb-delete":"Error thrown when deleting from IndexedDB. Original error: {$originalErrorMessage}.","finalization-registry-not-supported":"FirebaseServerApp deleteOnDeref field defined but the JS runtime does not support FinalizationRegistry.","invalid-server-app-environment":"FirebaseServerApp is not for use in browser environments."},Pe=new sn("app","Firebase",Fh);/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Uh{constructor(e,t,i){this._isDeleted=!1,this._options=Object.assign({},e),this._config=Object.assign({},t),this._name=t.name,this._automaticDataCollectionEnabled=t.automaticDataCollectionEnabled,this._container=i,this.container.addComponent(new Ke("app",()=>this,"PUBLIC"))}get automaticDataCollectionEnabled(){return this.checkDestroyed(),this._automaticDataCollectionEnabled}set automaticDataCollectionEnabled(e){this.checkDestroyed(),this._automaticDataCollectionEnabled=e}get name(){return this.checkDestroyed(),this._name}get options(){return this.checkDestroyed(),this._options}get config(){return this.checkDestroyed(),this._config}get container(){return this._container}get isDeleted(){return this._isDeleted}set isDeleted(e){this._isDeleted=e}checkDestroyed(){if(this.isDeleted)throw Pe.create("app-deleted",{appName:this._name})}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ct=xh;function ea(n,e={}){let t=n;typeof e!="object"&&(e={name:e});const i=Object.assign({name:Gi,automaticDataCollectionEnabled:!1},e),s=i.name;if(typeof s!="string"||!s)throw Pe.create("bad-app-name",{appName:String(s)});if(t||(t=Ko()),!t)throw Pe.create("no-options");const r=Wn.get(s);if(r){if($n(t,r.options)&&$n(i,r.config))return r;throw Pe.create("duplicate-app",{appName:s})}const o=new qu(s);for(const c of Ki.values())o.addComponent(c);const a=new Uh(t,i,o);return Wn.set(s,a),a}function ta(n=Gi){const e=Wn.get(n);if(!e&&n===Gi&&Ko())return ea();if(!e)throw Pe.create("no-app",{appName:n});return e}function Oe(n,e,t){var i;let s=(i=Lh[n])!==null&&i!==void 0?i:n;t&&(s+=`-${t}`);const r=s.match(/\s|\//),o=e.match(/\s|\//);if(r||o){const a=[`Unable to register library "${s}" with version "${e}":`];r&&a.push(`library name "${s}" contains illegal characters (whitespace or "/")`),r&&o&&a.push("and"),o&&a.push(`version name "${e}" contains illegal characters (whitespace or "/")`),ge.warn(a.join(" "));return}_t(new Ke(`${s}-version`,()=>({library:s,version:e}),"VERSION"))}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const $h="firebase-heartbeat-database",Wh=1,Kt="firebase-heartbeat-store";let Ai=null;function na(){return Ai||(Ai=ih($h,Wh,{upgrade:(n,e)=>{switch(e){case 0:try{n.createObjectStore(Kt)}catch(t){console.warn(t)}}}}).catch(n=>{throw Pe.create("idb-open",{originalErrorMessage:n.message})})),Ai}async function Bh(n){try{const t=(await na()).transaction(Kt),i=await t.objectStore(Kt).get(ia(n));return await t.done,i}catch(e){if(e instanceof $e)ge.warn(e.message);else{const t=Pe.create("idb-get",{originalErrorMessage:e==null?void 0:e.message});ge.warn(t.message)}}}async function Ir(n,e){try{const i=(await na()).transaction(Kt,"readwrite");await i.objectStore(Kt).put(e,ia(n)),await i.done}catch(t){if(t instanceof $e)ge.warn(t.message);else{const i=Pe.create("idb-set",{originalErrorMessage:t==null?void 0:t.message});ge.warn(i.message)}}}function ia(n){return`${n.name}!${n.options.appId}`}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Hh=1024,Vh=30*24*60*60*1e3;class qh{constructor(e){this.container=e,this._heartbeatsCache=null;const t=this.container.getProvider("app").getImmediate();this._storage=new zh(t),this._heartbeatsCachePromise=this._storage.read().then(i=>(this._heartbeatsCache=i,i))}async triggerHeartbeat(){var e,t;try{const s=this.container.getProvider("platform-logger").getImmediate().getPlatformInfoString(),r=Cr();return((e=this._heartbeatsCache)===null||e===void 0?void 0:e.heartbeats)==null&&(this._heartbeatsCache=await this._heartbeatsCachePromise,((t=this._heartbeatsCache)===null||t===void 0?void 0:t.heartbeats)==null)||this._heartbeatsCache.lastSentHeartbeatDate===r||this._heartbeatsCache.heartbeats.some(o=>o.date===r)?void 0:(this._heartbeatsCache.heartbeats.push({date:r,agent:s}),this._heartbeatsCache.heartbeats=this._heartbeatsCache.heartbeats.filter(o=>{const a=new Date(o.date).valueOf();return Date.now()-a<=Vh}),this._storage.overwrite(this._heartbeatsCache))}catch(i){ge.warn(i)}}async getHeartbeatsHeader(){var e;try{if(this._heartbeatsCache===null&&await this._heartbeatsCachePromise,((e=this._heartbeatsCache)===null||e===void 0?void 0:e.heartbeats)==null||this._heartbeatsCache.heartbeats.length===0)return"";const t=Cr(),{heartbeatsToSend:i,unsentEntries:s}=jh(this._heartbeatsCache.heartbeats),r=Mn(JSON.stringify({version:2,heartbeats:i}));return this._heartbeatsCache.lastSentHeartbeatDate=t,s.length>0?(this._heartbeatsCache.heartbeats=s,await this._storage.overwrite(this._heartbeatsCache)):(this._heartbeatsCache.heartbeats=[],this._storage.overwrite(this._heartbeatsCache)),r}catch(t){return ge.warn(t),""}}}function Cr(){return new Date().toISOString().substring(0,10)}function jh(n,e=Hh){const t=[];let i=n.slice();for(const s of n){const r=t.find(o=>o.agent===s.agent);if(r){if(r.dates.push(s.date),br(t)>e){r.dates.pop();break}}else if(t.push({agent:s.agent,dates:[s.date]}),br(t)>e){t.pop();break}i=i.slice(1)}return{heartbeatsToSend:t,unsentEntries:i}}class zh{constructor(e){this.app=e,this._canUseIndexedDBPromise=this.runIndexedDBEnvironmentCheck()}async runIndexedDBEnvironmentCheck(){return Ru()?Nu().then(()=>!0).catch(()=>!1):!1}async read(){if(await this._canUseIndexedDBPromise){const t=await Bh(this.app);return t!=null&&t.heartbeats?t:{heartbeats:[]}}else return{heartbeats:[]}}async overwrite(e){var t;if(await this._canUseIndexedDBPromise){const s=await this.read();return Ir(this.app,{lastSentHeartbeatDate:(t=e.lastSentHeartbeatDate)!==null&&t!==void 0?t:s.lastSentHeartbeatDate,heartbeats:e.heartbeats})}else return}async add(e){var t;if(await this._canUseIndexedDBPromise){const s=await this.read();return Ir(this.app,{lastSentHeartbeatDate:(t=e.lastSentHeartbeatDate)!==null&&t!==void 0?t:s.lastSentHeartbeatDate,heartbeats:[...s.heartbeats,...e.heartbeats]})}else return}}function br(n){return Mn(JSON.stringify({version:2,heartbeats:n})).length}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Gh(n){_t(new Ke("platform-logger",e=>new oh(e),"PRIVATE")),_t(new Ke("heartbeat",e=>new qh(e),"PRIVATE")),Oe(zi,wr,n),Oe(zi,wr,"esm2017"),Oe("fire-js","")}Gh("");var Kh="firebase",Yh="10.14.1";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */Oe(Kh,Yh,"app");function ws(n,e){var t={};for(var i in n)Object.prototype.hasOwnProperty.call(n,i)&&e.indexOf(i)<0&&(t[i]=n[i]);if(n!=null&&typeof Object.getOwnPropertySymbols=="function")for(var s=0,i=Object.getOwnPropertySymbols(n);s<i.length;s++)e.indexOf(i[s])<0&&Object.prototype.propertyIsEnumerable.call(n,i[s])&&(t[i[s]]=n[i[s]]);return t}function sa(){return{"dependent-sdk-initialized-before-auth":"Another Firebase SDK was initialized and is trying to use Auth before Auth is initialized. Please be sure to call `initializeAuth` or `getAuth` before starting any other Firebase SDK."}}const Qh=sa,ra=new sn("auth","Firebase",sa());/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Bn=new gs("@firebase/auth");function Jh(n,...e){Bn.logLevel<=T.WARN&&Bn.warn(`Auth (${Ct}): ${n}`,...e)}function In(n,...e){Bn.logLevel<=T.ERROR&&Bn.error(`Auth (${Ct}): ${n}`,...e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ve(n,...e){throw Es(n,...e)}function ae(n,...e){return Es(n,...e)}function oa(n,e,t){const i=Object.assign(Object.assign({},Qh()),{[e]:t});return new sn("auth","Firebase",i).create(e,{appName:n.name})}function De(n){return oa(n,"operation-not-supported-in-this-environment","Operations that alter the current user are not supported in conjunction with FirebaseServerApp")}function Es(n,...e){if(typeof n!="string"){const t=e[0],i=[...e.slice(1)];return i[0]&&(i[0].appName=n.name),n._errorFactory.create(t,...i)}return ra.create(n,...e)}function w(n,e,...t){if(!n)throw Es(e,...t)}function he(n){const e="INTERNAL ASSERTION FAILED: "+n;throw In(e),new Error(e)}function ye(n,e){n||he(e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Yi(){var n;return typeof self<"u"&&((n=self.location)===null||n===void 0?void 0:n.href)||""}function Xh(){return Sr()==="http:"||Sr()==="https:"}function Sr(){var n;return typeof self<"u"&&((n=self.location)===null||n===void 0?void 0:n.protocol)||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Zh(){return typeof navigator<"u"&&navigator&&"onLine"in navigator&&typeof navigator.onLine=="boolean"&&(Xh()||Tu()||"connection"in navigator)?navigator.onLine:!0}function ed(){if(typeof navigator>"u")return null;const n=navigator;return n.languages&&n.languages[0]||n.language||null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rn{constructor(e,t){this.shortDelay=e,this.longDelay=t,ye(t>e,"Short delay should be less than long delay!"),this.isMobile=ms()||Qo()}get(){return Zh()?this.isMobile?this.longDelay:this.shortDelay:Math.min(5e3,this.shortDelay)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Is(n,e){ye(n.emulator,"Emulator should always be set here");const{url:t}=n.emulator;return e?`${t}${e.startsWith("/")?e.slice(1):e}`:t}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class aa{static initialize(e,t,i){this.fetchImpl=e,t&&(this.headersImpl=t),i&&(this.responseImpl=i)}static fetch(){if(this.fetchImpl)return this.fetchImpl;if(typeof self<"u"&&"fetch"in self)return self.fetch;if(typeof globalThis<"u"&&globalThis.fetch)return globalThis.fetch;if(typeof fetch<"u")return fetch;he("Could not find fetch implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static headers(){if(this.headersImpl)return this.headersImpl;if(typeof self<"u"&&"Headers"in self)return self.Headers;if(typeof globalThis<"u"&&globalThis.Headers)return globalThis.Headers;if(typeof Headers<"u")return Headers;he("Could not find Headers implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}static response(){if(this.responseImpl)return this.responseImpl;if(typeof self<"u"&&"Response"in self)return self.Response;if(typeof globalThis<"u"&&globalThis.Response)return globalThis.Response;if(typeof Response<"u")return Response;he("Could not find Response implementation, make sure you call FetchProvider.initialize() with an appropriate polyfill")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const td={CREDENTIAL_MISMATCH:"custom-token-mismatch",MISSING_CUSTOM_TOKEN:"internal-error",INVALID_IDENTIFIER:"invalid-email",MISSING_CONTINUE_URI:"internal-error",INVALID_PASSWORD:"wrong-password",MISSING_PASSWORD:"missing-password",INVALID_LOGIN_CREDENTIALS:"invalid-credential",EMAIL_EXISTS:"email-already-in-use",PASSWORD_LOGIN_DISABLED:"operation-not-allowed",INVALID_IDP_RESPONSE:"invalid-credential",INVALID_PENDING_TOKEN:"invalid-credential",FEDERATED_USER_ID_ALREADY_LINKED:"credential-already-in-use",MISSING_REQ_TYPE:"internal-error",EMAIL_NOT_FOUND:"user-not-found",RESET_PASSWORD_EXCEED_LIMIT:"too-many-requests",EXPIRED_OOB_CODE:"expired-action-code",INVALID_OOB_CODE:"invalid-action-code",MISSING_OOB_CODE:"internal-error",CREDENTIAL_TOO_OLD_LOGIN_AGAIN:"requires-recent-login",INVALID_ID_TOKEN:"invalid-user-token",TOKEN_EXPIRED:"user-token-expired",USER_NOT_FOUND:"user-token-expired",TOO_MANY_ATTEMPTS_TRY_LATER:"too-many-requests",PASSWORD_DOES_NOT_MEET_REQUIREMENTS:"password-does-not-meet-requirements",INVALID_CODE:"invalid-verification-code",INVALID_SESSION_INFO:"invalid-verification-id",INVALID_TEMPORARY_PROOF:"invalid-credential",MISSING_SESSION_INFO:"missing-verification-id",SESSION_EXPIRED:"code-expired",MISSING_ANDROID_PACKAGE_NAME:"missing-android-pkg-name",UNAUTHORIZED_DOMAIN:"unauthorized-continue-uri",INVALID_OAUTH_CLIENT_ID:"invalid-oauth-client-id",ADMIN_ONLY_OPERATION:"admin-restricted-operation",INVALID_MFA_PENDING_CREDENTIAL:"invalid-multi-factor-session",MFA_ENROLLMENT_NOT_FOUND:"multi-factor-info-not-found",MISSING_MFA_ENROLLMENT_ID:"missing-multi-factor-info",MISSING_MFA_PENDING_CREDENTIAL:"missing-multi-factor-session",SECOND_FACTOR_EXISTS:"second-factor-already-in-use",SECOND_FACTOR_LIMIT_EXCEEDED:"maximum-second-factor-count-exceeded",BLOCKING_FUNCTION_ERROR_RESPONSE:"internal-error",RECAPTCHA_NOT_ENABLED:"recaptcha-not-enabled",MISSING_RECAPTCHA_TOKEN:"missing-recaptcha-token",INVALID_RECAPTCHA_TOKEN:"invalid-recaptcha-token",INVALID_RECAPTCHA_ACTION:"invalid-recaptcha-action",MISSING_CLIENT_TYPE:"missing-client-type",MISSING_RECAPTCHA_VERSION:"missing-recaptcha-version",INVALID_RECAPTCHA_VERSION:"invalid-recaptcha-version",INVALID_REQ_TYPE:"invalid-req-type"};/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nd=new rn(3e4,6e4);function li(n,e){return n.tenantId&&!e.tenantId?Object.assign(Object.assign({},e),{tenantId:n.tenantId}):e}async function bt(n,e,t,i,s={}){return ca(n,s,async()=>{let r={},o={};i&&(e==="GET"?o=i:r={body:JSON.stringify(i)});const a=It(Object.assign({key:n.config.apiKey},o)).slice(1),c=await n._getAdditionalHeaders();c["Content-Type"]="application/json",n.languageCode&&(c["X-Firebase-Locale"]=n.languageCode);const l=Object.assign({method:e,headers:c},r);return Su()||(l.referrerPolicy="no-referrer"),aa.fetch()(ua(n,n.config.apiHost,t,a),l)})}async function ca(n,e,t){n._canInitEmulator=!1;const i=Object.assign(Object.assign({},td),e);try{const s=new id(n),r=await Promise.race([t(),s.promise]);s.clearNetworkTimeout();const o=await r.json();if("needConfirmation"in o)throw pn(n,"account-exists-with-different-credential",o);if(r.ok&&!("errorMessage"in o))return o;{const a=r.ok?o.errorMessage:o.error.message,[c,l]=a.split(" : ");if(c==="FEDERATED_USER_ID_ALREADY_LINKED")throw pn(n,"credential-already-in-use",o);if(c==="EMAIL_EXISTS")throw pn(n,"email-already-in-use",o);if(c==="USER_DISABLED")throw pn(n,"user-disabled",o);const h=i[c]||c.toLowerCase().replace(/[_\s]+/g,"-");if(l)throw oa(n,h,l);ve(n,h)}}catch(s){if(s instanceof $e)throw s;ve(n,"network-request-failed",{message:String(s)})}}async function la(n,e,t,i,s={}){const r=await bt(n,e,t,i,s);return"mfaPendingCredential"in r&&ve(n,"multi-factor-auth-required",{_serverResponse:r}),r}function ua(n,e,t,i){const s=`${e}${t}?${i}`;return n.config.emulator?Is(n.config,s):`${n.config.apiScheme}://${s}`}class id{constructor(e){this.auth=e,this.timer=null,this.promise=new Promise((t,i)=>{this.timer=setTimeout(()=>i(ae(this.auth,"network-request-failed")),nd.get())})}clearNetworkTimeout(){clearTimeout(this.timer)}}function pn(n,e,t){const i={appName:n.name};t.email&&(i.email=t.email),t.phoneNumber&&(i.phoneNumber=t.phoneNumber);const s=ae(n,e,i);return s.customData._tokenResponse=t,s}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function sd(n,e){return bt(n,"POST","/v1/accounts:delete",e)}async function ha(n,e){return bt(n,"POST","/v1/accounts:lookup",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ut(n){if(n)try{const e=new Date(Number(n));if(!isNaN(e.getTime()))return e.toUTCString()}catch{}}async function rd(n,e=!1){const t=Q(n),i=await t.getIdToken(e),s=Cs(i);w(s&&s.exp&&s.auth_time&&s.iat,t.auth,"internal-error");const r=typeof s.firebase=="object"?s.firebase:void 0,o=r==null?void 0:r.sign_in_provider;return{claims:s,token:i,authTime:Ut(Ri(s.auth_time)),issuedAtTime:Ut(Ri(s.iat)),expirationTime:Ut(Ri(s.exp)),signInProvider:o||null,signInSecondFactor:(r==null?void 0:r.sign_in_second_factor)||null}}function Ri(n){return Number(n)*1e3}function Cs(n){const[e,t,i]=n.split(".");if(e===void 0||t===void 0||i===void 0)return In("JWT malformed, contained fewer than 3 sections"),null;try{const s=Fn(t);return s?JSON.parse(s):(In("Failed to decode base64 JWT payload"),null)}catch(s){return In("Caught error parsing JWT payload as JSON",s==null?void 0:s.toString()),null}}function Tr(n){const e=Cs(n);return w(e,"internal-error"),w(typeof e.exp<"u","internal-error"),w(typeof e.iat<"u","internal-error"),Number(e.exp)-Number(e.iat)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Yt(n,e,t=!1){if(t)return e;try{return await e}catch(i){throw i instanceof $e&&od(i)&&n.auth.currentUser===n&&await n.auth.signOut(),i}}function od({code:n}){return n==="auth/user-disabled"||n==="auth/user-token-expired"}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ad{constructor(e){this.user=e,this.isRunning=!1,this.timerId=null,this.errorBackoff=3e4}_start(){this.isRunning||(this.isRunning=!0,this.schedule())}_stop(){this.isRunning&&(this.isRunning=!1,this.timerId!==null&&clearTimeout(this.timerId))}getInterval(e){var t;if(e){const i=this.errorBackoff;return this.errorBackoff=Math.min(this.errorBackoff*2,96e4),i}else{this.errorBackoff=3e4;const s=((t=this.user.stsTokenManager.expirationTime)!==null&&t!==void 0?t:0)-Date.now()-3e5;return Math.max(0,s)}}schedule(e=!1){if(!this.isRunning)return;const t=this.getInterval(e);this.timerId=setTimeout(async()=>{await this.iteration()},t)}async iteration(){try{await this.user.getIdToken(!0)}catch(e){(e==null?void 0:e.code)==="auth/network-request-failed"&&this.schedule(!0);return}this.schedule()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qi{constructor(e,t){this.createdAt=e,this.lastLoginAt=t,this._initializeTime()}_initializeTime(){this.lastSignInTime=Ut(this.lastLoginAt),this.creationTime=Ut(this.createdAt)}_copy(e){this.createdAt=e.createdAt,this.lastLoginAt=e.lastLoginAt,this._initializeTime()}toJSON(){return{createdAt:this.createdAt,lastLoginAt:this.lastLoginAt}}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Hn(n){var e;const t=n.auth,i=await n.getIdToken(),s=await Yt(n,ha(t,{idToken:i}));w(s==null?void 0:s.users.length,t,"internal-error");const r=s.users[0];n._notifyReloadListener(r);const o=!((e=r.providerUserInfo)===null||e===void 0)&&e.length?da(r.providerUserInfo):[],a=ld(n.providerData,o),c=n.isAnonymous,l=!(n.email&&r.passwordHash)&&!(a!=null&&a.length),h=c?l:!1,u={uid:r.localId,displayName:r.displayName||null,photoURL:r.photoUrl||null,email:r.email||null,emailVerified:r.emailVerified||!1,phoneNumber:r.phoneNumber||null,tenantId:r.tenantId||null,providerData:a,metadata:new Qi(r.createdAt,r.lastLoginAt),isAnonymous:h};Object.assign(n,u)}async function cd(n){const e=Q(n);await Hn(e),await e.auth._persistUserIfCurrent(e),e.auth._notifyListenersIfCurrent(e)}function ld(n,e){return[...n.filter(i=>!e.some(s=>s.providerId===i.providerId)),...e]}function da(n){return n.map(e=>{var{providerId:t}=e,i=ws(e,["providerId"]);return{providerId:t,uid:i.rawId||"",displayName:i.displayName||null,email:i.email||null,phoneNumber:i.phoneNumber||null,photoURL:i.photoUrl||null}})}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ud(n,e){const t=await ca(n,{},async()=>{const i=It({grant_type:"refresh_token",refresh_token:e}).slice(1),{tokenApiHost:s,apiKey:r}=n.config,o=ua(n,s,"/v1/token",`key=${r}`),a=await n._getAdditionalHeaders();return a["Content-Type"]="application/x-www-form-urlencoded",aa.fetch()(o,{method:"POST",headers:a,body:i})});return{accessToken:t.access_token,expiresIn:t.expires_in,refreshToken:t.refresh_token}}async function hd(n,e){return bt(n,"POST","/v2/accounts:revokeToken",li(n,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lt{constructor(){this.refreshToken=null,this.accessToken=null,this.expirationTime=null}get isExpired(){return!this.expirationTime||Date.now()>this.expirationTime-3e4}updateFromServerResponse(e){w(e.idToken,"internal-error"),w(typeof e.idToken<"u","internal-error"),w(typeof e.refreshToken<"u","internal-error");const t="expiresIn"in e&&typeof e.expiresIn<"u"?Number(e.expiresIn):Tr(e.idToken);this.updateTokensAndExpiration(e.idToken,e.refreshToken,t)}updateFromIdToken(e){w(e.length!==0,"internal-error");const t=Tr(e);this.updateTokensAndExpiration(e,null,t)}async getToken(e,t=!1){return!t&&this.accessToken&&!this.isExpired?this.accessToken:(w(this.refreshToken,e,"user-token-expired"),this.refreshToken?(await this.refresh(e,this.refreshToken),this.accessToken):null)}clearRefreshToken(){this.refreshToken=null}async refresh(e,t){const{accessToken:i,refreshToken:s,expiresIn:r}=await ud(e,t);this.updateTokensAndExpiration(i,s,Number(r))}updateTokensAndExpiration(e,t,i){this.refreshToken=t||null,this.accessToken=e||null,this.expirationTime=Date.now()+i*1e3}static fromJSON(e,t){const{refreshToken:i,accessToken:s,expirationTime:r}=t,o=new lt;return i&&(w(typeof i=="string","internal-error",{appName:e}),o.refreshToken=i),s&&(w(typeof s=="string","internal-error",{appName:e}),o.accessToken=s),r&&(w(typeof r=="number","internal-error",{appName:e}),o.expirationTime=r),o}toJSON(){return{refreshToken:this.refreshToken,accessToken:this.accessToken,expirationTime:this.expirationTime}}_assign(e){this.accessToken=e.accessToken,this.refreshToken=e.refreshToken,this.expirationTime=e.expirationTime}_clone(){return Object.assign(new lt,this.toJSON())}_performRefresh(){return he("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ce(n,e){w(typeof n=="string"||typeof n>"u","internal-error",{appName:e})}class de{constructor(e){var{uid:t,auth:i,stsTokenManager:s}=e,r=ws(e,["uid","auth","stsTokenManager"]);this.providerId="firebase",this.proactiveRefresh=new ad(this),this.reloadUserInfo=null,this.reloadListener=null,this.uid=t,this.auth=i,this.stsTokenManager=s,this.accessToken=s.accessToken,this.displayName=r.displayName||null,this.email=r.email||null,this.emailVerified=r.emailVerified||!1,this.phoneNumber=r.phoneNumber||null,this.photoURL=r.photoURL||null,this.isAnonymous=r.isAnonymous||!1,this.tenantId=r.tenantId||null,this.providerData=r.providerData?[...r.providerData]:[],this.metadata=new Qi(r.createdAt||void 0,r.lastLoginAt||void 0)}async getIdToken(e){const t=await Yt(this,this.stsTokenManager.getToken(this.auth,e));return w(t,this.auth,"internal-error"),this.accessToken!==t&&(this.accessToken=t,await this.auth._persistUserIfCurrent(this),this.auth._notifyListenersIfCurrent(this)),t}getIdTokenResult(e){return rd(this,e)}reload(){return cd(this)}_assign(e){this!==e&&(w(this.uid===e.uid,this.auth,"internal-error"),this.displayName=e.displayName,this.photoURL=e.photoURL,this.email=e.email,this.emailVerified=e.emailVerified,this.phoneNumber=e.phoneNumber,this.isAnonymous=e.isAnonymous,this.tenantId=e.tenantId,this.providerData=e.providerData.map(t=>Object.assign({},t)),this.metadata._copy(e.metadata),this.stsTokenManager._assign(e.stsTokenManager))}_clone(e){const t=new de(Object.assign(Object.assign({},this),{auth:e,stsTokenManager:this.stsTokenManager._clone()}));return t.metadata._copy(this.metadata),t}_onReload(e){w(!this.reloadListener,this.auth,"internal-error"),this.reloadListener=e,this.reloadUserInfo&&(this._notifyReloadListener(this.reloadUserInfo),this.reloadUserInfo=null)}_notifyReloadListener(e){this.reloadListener?this.reloadListener(e):this.reloadUserInfo=e}_startProactiveRefresh(){this.proactiveRefresh._start()}_stopProactiveRefresh(){this.proactiveRefresh._stop()}async _updateTokensIfNecessary(e,t=!1){let i=!1;e.idToken&&e.idToken!==this.stsTokenManager.accessToken&&(this.stsTokenManager.updateFromServerResponse(e),i=!0),t&&await Hn(this),await this.auth._persistUserIfCurrent(this),i&&this.auth._notifyListenersIfCurrent(this)}async delete(){if(ue(this.auth.app))return Promise.reject(De(this.auth));const e=await this.getIdToken();return await Yt(this,sd(this.auth,{idToken:e})),this.stsTokenManager.clearRefreshToken(),this.auth.signOut()}toJSON(){return Object.assign(Object.assign({uid:this.uid,email:this.email||void 0,emailVerified:this.emailVerified,displayName:this.displayName||void 0,isAnonymous:this.isAnonymous,photoURL:this.photoURL||void 0,phoneNumber:this.phoneNumber||void 0,tenantId:this.tenantId||void 0,providerData:this.providerData.map(e=>Object.assign({},e)),stsTokenManager:this.stsTokenManager.toJSON(),_redirectEventId:this._redirectEventId},this.metadata.toJSON()),{apiKey:this.auth.config.apiKey,appName:this.auth.name})}get refreshToken(){return this.stsTokenManager.refreshToken||""}static _fromJSON(e,t){var i,s,r,o,a,c,l,h;const u=(i=t.displayName)!==null&&i!==void 0?i:void 0,d=(s=t.email)!==null&&s!==void 0?s:void 0,f=(r=t.phoneNumber)!==null&&r!==void 0?r:void 0,m=(o=t.photoURL)!==null&&o!==void 0?o:void 0,v=(a=t.tenantId)!==null&&a!==void 0?a:void 0,E=(c=t._redirectEventId)!==null&&c!==void 0?c:void 0,N=(l=t.createdAt)!==null&&l!==void 0?l:void 0,P=(h=t.lastLoginAt)!==null&&h!==void 0?h:void 0,{uid:O,emailVerified:L,isAnonymous:J,providerData:Be,stsTokenManager:tt}=t;w(O&&tt,e,"internal-error");const fn=lt.fromJSON(this.name,tt);w(typeof O=="string",e,"internal-error"),Ce(u,e.name),Ce(d,e.name),w(typeof L=="boolean",e,"internal-error"),w(typeof J=="boolean",e,"internal-error"),Ce(f,e.name),Ce(m,e.name),Ce(v,e.name),Ce(E,e.name),Ce(N,e.name),Ce(P,e.name);const At=new de({uid:O,auth:e,email:d,emailVerified:L,displayName:u,isAnonymous:J,photoURL:m,phoneNumber:f,tenantId:v,stsTokenManager:fn,createdAt:N,lastLoginAt:P});return Be&&Array.isArray(Be)&&(At.providerData=Be.map(Rt=>Object.assign({},Rt))),E&&(At._redirectEventId=E),At}static async _fromIdTokenResponse(e,t,i=!1){const s=new lt;s.updateFromServerResponse(t);const r=new de({uid:t.localId,auth:e,stsTokenManager:s,isAnonymous:i});return await Hn(r),r}static async _fromGetAccountInfoResponse(e,t,i){const s=t.users[0];w(s.localId!==void 0,"internal-error");const r=s.providerUserInfo!==void 0?da(s.providerUserInfo):[],o=!(s.email&&s.passwordHash)&&!(r!=null&&r.length),a=new lt;a.updateFromIdToken(i);const c=new de({uid:s.localId,auth:e,stsTokenManager:a,isAnonymous:o}),l={uid:s.localId,displayName:s.displayName||null,photoURL:s.photoUrl||null,email:s.email||null,emailVerified:s.emailVerified||!1,phoneNumber:s.phoneNumber||null,tenantId:s.tenantId||null,providerData:r,metadata:new Qi(s.createdAt,s.lastLoginAt),isAnonymous:!(s.email&&s.passwordHash)&&!(r!=null&&r.length)};return Object.assign(c,l),c}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const kr=new Map;function fe(n){ye(n instanceof Function,"Expected a class definition");let e=kr.get(n);return e?(ye(e instanceof n,"Instance stored in cache mismatched with class"),e):(e=new n,kr.set(n,e),e)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fa{constructor(){this.type="NONE",this.storage={}}async _isAvailable(){return!0}async _set(e,t){this.storage[e]=t}async _get(e){const t=this.storage[e];return t===void 0?null:t}async _remove(e){delete this.storage[e]}_addListener(e,t){}_removeListener(e,t){}}fa.type="NONE";const Ar=fa;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Cn(n,e,t){return`firebase:${n}:${e}:${t}`}class ut{constructor(e,t,i){this.persistence=e,this.auth=t,this.userKey=i;const{config:s,name:r}=this.auth;this.fullUserKey=Cn(this.userKey,s.apiKey,r),this.fullPersistenceKey=Cn("persistence",s.apiKey,r),this.boundEventHandler=t._onStorageEvent.bind(t),this.persistence._addListener(this.fullUserKey,this.boundEventHandler)}setCurrentUser(e){return this.persistence._set(this.fullUserKey,e.toJSON())}async getCurrentUser(){const e=await this.persistence._get(this.fullUserKey);return e?de._fromJSON(this.auth,e):null}removeCurrentUser(){return this.persistence._remove(this.fullUserKey)}savePersistenceForRedirect(){return this.persistence._set(this.fullPersistenceKey,this.persistence.type)}async setPersistence(e){if(this.persistence===e)return;const t=await this.getCurrentUser();if(await this.removeCurrentUser(),this.persistence=e,t)return this.setCurrentUser(t)}delete(){this.persistence._removeListener(this.fullUserKey,this.boundEventHandler)}static async create(e,t,i="authUser"){if(!t.length)return new ut(fe(Ar),e,i);const s=(await Promise.all(t.map(async l=>{if(await l._isAvailable())return l}))).filter(l=>l);let r=s[0]||fe(Ar);const o=Cn(i,e.config.apiKey,e.name);let a=null;for(const l of t)try{const h=await l._get(o);if(h){const u=de._fromJSON(e,h);l!==r&&(a=u),r=l;break}}catch{}const c=s.filter(l=>l._shouldAllowMigration);return!r._shouldAllowMigration||!c.length?new ut(r,e,i):(r=c[0],a&&await r._set(o,a.toJSON()),await Promise.all(t.map(async l=>{if(l!==r)try{await l._remove(o)}catch{}})),new ut(r,e,i))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Rr(n){const e=n.toLowerCase();if(e.includes("opera/")||e.includes("opr/")||e.includes("opios/"))return"Opera";if(ga(e))return"IEMobile";if(e.includes("msie")||e.includes("trident/"))return"IE";if(e.includes("edge/"))return"Edge";if(pa(e))return"Firefox";if(e.includes("silk/"))return"Silk";if(ya(e))return"Blackberry";if(wa(e))return"Webos";if(ma(e))return"Safari";if((e.includes("chrome/")||_a(e))&&!e.includes("edge/"))return"Chrome";if(va(e))return"Android";{const t=/([a-zA-Z\d\.]+)\/[a-zA-Z\d\.]*$/,i=n.match(t);if((i==null?void 0:i.length)===2)return i[1]}return"Other"}function pa(n=q()){return/firefox\//i.test(n)}function ma(n=q()){const e=n.toLowerCase();return e.includes("safari/")&&!e.includes("chrome/")&&!e.includes("crios/")&&!e.includes("android")}function _a(n=q()){return/crios\//i.test(n)}function ga(n=q()){return/iemobile/i.test(n)}function va(n=q()){return/android/i.test(n)}function ya(n=q()){return/blackberry/i.test(n)}function wa(n=q()){return/webos/i.test(n)}function bs(n=q()){return/iphone|ipad|ipod/i.test(n)||/macintosh/i.test(n)&&/mobile/i.test(n)}function dd(n=q()){var e;return bs(n)&&!!(!((e=window.navigator)===null||e===void 0)&&e.standalone)}function fd(){return ku()&&document.documentMode===10}function Ea(n=q()){return bs(n)||va(n)||wa(n)||ya(n)||/windows phone/i.test(n)||ga(n)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ia(n,e=[]){let t;switch(n){case"Browser":t=Rr(q());break;case"Worker":t=`${Rr(q())}-${n}`;break;default:t=n}const i=e.length?e.join(","):"FirebaseCore-web";return`${t}/JsCore/${Ct}/${i}`}/**
 * @license
 * Copyright 2022 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class pd{constructor(e){this.auth=e,this.queue=[]}pushCallback(e,t){const i=r=>new Promise((o,a)=>{try{const c=e(r);o(c)}catch(c){a(c)}});i.onAbort=t,this.queue.push(i);const s=this.queue.length-1;return()=>{this.queue[s]=()=>Promise.resolve()}}async runMiddleware(e){if(this.auth.currentUser===e)return;const t=[];try{for(const i of this.queue)await i(e),i.onAbort&&t.push(i.onAbort)}catch(i){t.reverse();for(const s of t)try{s()}catch{}throw this.auth._errorFactory.create("login-blocked",{originalMessage:i==null?void 0:i.message})}}}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function md(n,e={}){return bt(n,"GET","/v2/passwordPolicy",li(n,e))}/**
 * @license
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const _d=6;class gd{constructor(e){var t,i,s,r;const o=e.customStrengthOptions;this.customStrengthOptions={},this.customStrengthOptions.minPasswordLength=(t=o.minPasswordLength)!==null&&t!==void 0?t:_d,o.maxPasswordLength&&(this.customStrengthOptions.maxPasswordLength=o.maxPasswordLength),o.containsLowercaseCharacter!==void 0&&(this.customStrengthOptions.containsLowercaseLetter=o.containsLowercaseCharacter),o.containsUppercaseCharacter!==void 0&&(this.customStrengthOptions.containsUppercaseLetter=o.containsUppercaseCharacter),o.containsNumericCharacter!==void 0&&(this.customStrengthOptions.containsNumericCharacter=o.containsNumericCharacter),o.containsNonAlphanumericCharacter!==void 0&&(this.customStrengthOptions.containsNonAlphanumericCharacter=o.containsNonAlphanumericCharacter),this.enforcementState=e.enforcementState,this.enforcementState==="ENFORCEMENT_STATE_UNSPECIFIED"&&(this.enforcementState="OFF"),this.allowedNonAlphanumericCharacters=(s=(i=e.allowedNonAlphanumericCharacters)===null||i===void 0?void 0:i.join(""))!==null&&s!==void 0?s:"",this.forceUpgradeOnSignin=(r=e.forceUpgradeOnSignin)!==null&&r!==void 0?r:!1,this.schemaVersion=e.schemaVersion}validatePassword(e){var t,i,s,r,o,a;const c={isValid:!0,passwordPolicy:this};return this.validatePasswordLengthOptions(e,c),this.validatePasswordCharacterOptions(e,c),c.isValid&&(c.isValid=(t=c.meetsMinPasswordLength)!==null&&t!==void 0?t:!0),c.isValid&&(c.isValid=(i=c.meetsMaxPasswordLength)!==null&&i!==void 0?i:!0),c.isValid&&(c.isValid=(s=c.containsLowercaseLetter)!==null&&s!==void 0?s:!0),c.isValid&&(c.isValid=(r=c.containsUppercaseLetter)!==null&&r!==void 0?r:!0),c.isValid&&(c.isValid=(o=c.containsNumericCharacter)!==null&&o!==void 0?o:!0),c.isValid&&(c.isValid=(a=c.containsNonAlphanumericCharacter)!==null&&a!==void 0?a:!0),c}validatePasswordLengthOptions(e,t){const i=this.customStrengthOptions.minPasswordLength,s=this.customStrengthOptions.maxPasswordLength;i&&(t.meetsMinPasswordLength=e.length>=i),s&&(t.meetsMaxPasswordLength=e.length<=s)}validatePasswordCharacterOptions(e,t){this.updatePasswordCharacterOptionsStatuses(t,!1,!1,!1,!1);let i;for(let s=0;s<e.length;s++)i=e.charAt(s),this.updatePasswordCharacterOptionsStatuses(t,i>="a"&&i<="z",i>="A"&&i<="Z",i>="0"&&i<="9",this.allowedNonAlphanumericCharacters.includes(i))}updatePasswordCharacterOptionsStatuses(e,t,i,s,r){this.customStrengthOptions.containsLowercaseLetter&&(e.containsLowercaseLetter||(e.containsLowercaseLetter=t)),this.customStrengthOptions.containsUppercaseLetter&&(e.containsUppercaseLetter||(e.containsUppercaseLetter=i)),this.customStrengthOptions.containsNumericCharacter&&(e.containsNumericCharacter||(e.containsNumericCharacter=s)),this.customStrengthOptions.containsNonAlphanumericCharacter&&(e.containsNonAlphanumericCharacter||(e.containsNonAlphanumericCharacter=r))}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class vd{constructor(e,t,i,s){this.app=e,this.heartbeatServiceProvider=t,this.appCheckServiceProvider=i,this.config=s,this.currentUser=null,this.emulatorConfig=null,this.operations=Promise.resolve(),this.authStateSubscription=new Nr(this),this.idTokenSubscription=new Nr(this),this.beforeStateQueue=new pd(this),this.redirectUser=null,this.isProactiveRefreshEnabled=!1,this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION=1,this._canInitEmulator=!0,this._isInitialized=!1,this._deleted=!1,this._initializationPromise=null,this._popupRedirectResolver=null,this._errorFactory=ra,this._agentRecaptchaConfig=null,this._tenantRecaptchaConfigs={},this._projectPasswordPolicy=null,this._tenantPasswordPolicies={},this.lastNotifiedUid=void 0,this.languageCode=null,this.tenantId=null,this.settings={appVerificationDisabledForTesting:!1},this.frameworks=[],this.name=e.name,this.clientVersion=s.sdkClientVersion}_initializeWithPersistence(e,t){return t&&(this._popupRedirectResolver=fe(t)),this._initializationPromise=this.queue(async()=>{var i,s;if(!this._deleted&&(this.persistenceManager=await ut.create(this,e),!this._deleted)){if(!((i=this._popupRedirectResolver)===null||i===void 0)&&i._shouldInitProactively)try{await this._popupRedirectResolver._initialize(this)}catch{}await this.initializeCurrentUser(t),this.lastNotifiedUid=((s=this.currentUser)===null||s===void 0?void 0:s.uid)||null,!this._deleted&&(this._isInitialized=!0)}}),this._initializationPromise}async _onStorageEvent(){if(this._deleted)return;const e=await this.assertedPersistence.getCurrentUser();if(!(!this.currentUser&&!e)){if(this.currentUser&&e&&this.currentUser.uid===e.uid){this._currentUser._assign(e),await this.currentUser.getIdToken();return}await this._updateCurrentUser(e,!0)}}async initializeCurrentUserFromIdToken(e){try{const t=await ha(this,{idToken:e}),i=await de._fromGetAccountInfoResponse(this,t,e);await this.directlySetCurrentUser(i)}catch(t){console.warn("FirebaseServerApp could not login user with provided authIdToken: ",t),await this.directlySetCurrentUser(null)}}async initializeCurrentUser(e){var t;if(ue(this.app)){const o=this.app.settings.authIdToken;return o?new Promise(a=>{setTimeout(()=>this.initializeCurrentUserFromIdToken(o).then(a,a))}):this.directlySetCurrentUser(null)}const i=await this.assertedPersistence.getCurrentUser();let s=i,r=!1;if(e&&this.config.authDomain){await this.getOrInitRedirectPersistenceManager();const o=(t=this.redirectUser)===null||t===void 0?void 0:t._redirectEventId,a=s==null?void 0:s._redirectEventId,c=await this.tryRedirectSignIn(e);(!o||o===a)&&(c!=null&&c.user)&&(s=c.user,r=!0)}if(!s)return this.directlySetCurrentUser(null);if(!s._redirectEventId){if(r)try{await this.beforeStateQueue.runMiddleware(s)}catch(o){s=i,this._popupRedirectResolver._overrideRedirectResult(this,()=>Promise.reject(o))}return s?this.reloadAndSetCurrentUserOrClear(s):this.directlySetCurrentUser(null)}return w(this._popupRedirectResolver,this,"argument-error"),await this.getOrInitRedirectPersistenceManager(),this.redirectUser&&this.redirectUser._redirectEventId===s._redirectEventId?this.directlySetCurrentUser(s):this.reloadAndSetCurrentUserOrClear(s)}async tryRedirectSignIn(e){let t=null;try{t=await this._popupRedirectResolver._completeRedirectFn(this,e,!0)}catch{await this._setRedirectUser(null)}return t}async reloadAndSetCurrentUserOrClear(e){try{await Hn(e)}catch(t){if((t==null?void 0:t.code)!=="auth/network-request-failed")return this.directlySetCurrentUser(null)}return this.directlySetCurrentUser(e)}useDeviceLanguage(){this.languageCode=ed()}async _delete(){this._deleted=!0}async updateCurrentUser(e){if(ue(this.app))return Promise.reject(De(this));const t=e?Q(e):null;return t&&w(t.auth.config.apiKey===this.config.apiKey,this,"invalid-user-token"),this._updateCurrentUser(t&&t._clone(this))}async _updateCurrentUser(e,t=!1){if(!this._deleted)return e&&w(this.tenantId===e.tenantId,this,"tenant-id-mismatch"),t||await this.beforeStateQueue.runMiddleware(e),this.queue(async()=>{await this.directlySetCurrentUser(e),this.notifyAuthListeners()})}async signOut(){return ue(this.app)?Promise.reject(De(this)):(await this.beforeStateQueue.runMiddleware(null),(this.redirectPersistenceManager||this._popupRedirectResolver)&&await this._setRedirectUser(null),this._updateCurrentUser(null,!0))}setPersistence(e){return ue(this.app)?Promise.reject(De(this)):this.queue(async()=>{await this.assertedPersistence.setPersistence(fe(e))})}_getRecaptchaConfig(){return this.tenantId==null?this._agentRecaptchaConfig:this._tenantRecaptchaConfigs[this.tenantId]}async validatePassword(e){this._getPasswordPolicyInternal()||await this._updatePasswordPolicy();const t=this._getPasswordPolicyInternal();return t.schemaVersion!==this.EXPECTED_PASSWORD_POLICY_SCHEMA_VERSION?Promise.reject(this._errorFactory.create("unsupported-password-policy-schema-version",{})):t.validatePassword(e)}_getPasswordPolicyInternal(){return this.tenantId===null?this._projectPasswordPolicy:this._tenantPasswordPolicies[this.tenantId]}async _updatePasswordPolicy(){const e=await md(this),t=new gd(e);this.tenantId===null?this._projectPasswordPolicy=t:this._tenantPasswordPolicies[this.tenantId]=t}_getPersistence(){return this.assertedPersistence.persistence.type}_updateErrorMap(e){this._errorFactory=new sn("auth","Firebase",e())}onAuthStateChanged(e,t,i){return this.registerStateListener(this.authStateSubscription,e,t,i)}beforeAuthStateChanged(e,t){return this.beforeStateQueue.pushCallback(e,t)}onIdTokenChanged(e,t,i){return this.registerStateListener(this.idTokenSubscription,e,t,i)}authStateReady(){return new Promise((e,t)=>{if(this.currentUser)e();else{const i=this.onAuthStateChanged(()=>{i(),e()},t)}})}async revokeAccessToken(e){if(this.currentUser){const t=await this.currentUser.getIdToken(),i={providerId:"apple.com",tokenType:"ACCESS_TOKEN",token:e,idToken:t};this.tenantId!=null&&(i.tenantId=this.tenantId),await hd(this,i)}}toJSON(){var e;return{apiKey:this.config.apiKey,authDomain:this.config.authDomain,appName:this.name,currentUser:(e=this._currentUser)===null||e===void 0?void 0:e.toJSON()}}async _setRedirectUser(e,t){const i=await this.getOrInitRedirectPersistenceManager(t);return e===null?i.removeCurrentUser():i.setCurrentUser(e)}async getOrInitRedirectPersistenceManager(e){if(!this.redirectPersistenceManager){const t=e&&fe(e)||this._popupRedirectResolver;w(t,this,"argument-error"),this.redirectPersistenceManager=await ut.create(this,[fe(t._redirectPersistence)],"redirectUser"),this.redirectUser=await this.redirectPersistenceManager.getCurrentUser()}return this.redirectPersistenceManager}async _redirectUserForId(e){var t,i;return this._isInitialized&&await this.queue(async()=>{}),((t=this._currentUser)===null||t===void 0?void 0:t._redirectEventId)===e?this._currentUser:((i=this.redirectUser)===null||i===void 0?void 0:i._redirectEventId)===e?this.redirectUser:null}async _persistUserIfCurrent(e){if(e===this.currentUser)return this.queue(async()=>this.directlySetCurrentUser(e))}_notifyListenersIfCurrent(e){e===this.currentUser&&this.notifyAuthListeners()}_key(){return`${this.config.authDomain}:${this.config.apiKey}:${this.name}`}_startProactiveRefresh(){this.isProactiveRefreshEnabled=!0,this.currentUser&&this._currentUser._startProactiveRefresh()}_stopProactiveRefresh(){this.isProactiveRefreshEnabled=!1,this.currentUser&&this._currentUser._stopProactiveRefresh()}get _currentUser(){return this.currentUser}notifyAuthListeners(){var e,t;if(!this._isInitialized)return;this.idTokenSubscription.next(this.currentUser);const i=(t=(e=this.currentUser)===null||e===void 0?void 0:e.uid)!==null&&t!==void 0?t:null;this.lastNotifiedUid!==i&&(this.lastNotifiedUid=i,this.authStateSubscription.next(this.currentUser))}registerStateListener(e,t,i,s){if(this._deleted)return()=>{};const r=typeof t=="function"?t:t.next.bind(t);let o=!1;const a=this._isInitialized?Promise.resolve():this._initializationPromise;if(w(a,this,"internal-error"),a.then(()=>{o||r(this.currentUser)}),typeof t=="function"){const c=e.addObserver(t,i,s);return()=>{o=!0,c()}}else{const c=e.addObserver(t);return()=>{o=!0,c()}}}async directlySetCurrentUser(e){this.currentUser&&this.currentUser!==e&&this._currentUser._stopProactiveRefresh(),e&&this.isProactiveRefreshEnabled&&e._startProactiveRefresh(),this.currentUser=e,e?await this.assertedPersistence.setCurrentUser(e):await this.assertedPersistence.removeCurrentUser()}queue(e){return this.operations=this.operations.then(e,e),this.operations}get assertedPersistence(){return w(this.persistenceManager,this,"internal-error"),this.persistenceManager}_logFramework(e){!e||this.frameworks.includes(e)||(this.frameworks.push(e),this.frameworks.sort(),this.clientVersion=Ia(this.config.clientPlatform,this._getFrameworks()))}_getFrameworks(){return this.frameworks}async _getAdditionalHeaders(){var e;const t={"X-Client-Version":this.clientVersion};this.app.options.appId&&(t["X-Firebase-gmpid"]=this.app.options.appId);const i=await((e=this.heartbeatServiceProvider.getImmediate({optional:!0}))===null||e===void 0?void 0:e.getHeartbeatsHeader());i&&(t["X-Firebase-Client"]=i);const s=await this._getAppCheckToken();return s&&(t["X-Firebase-AppCheck"]=s),t}async _getAppCheckToken(){var e;const t=await((e=this.appCheckServiceProvider.getImmediate({optional:!0}))===null||e===void 0?void 0:e.getToken());return t!=null&&t.error&&Jh(`Error while retrieving App Check token: ${t.error}`),t==null?void 0:t.token}}function ui(n){return Q(n)}class Nr{constructor(e){this.auth=e,this.observer=null,this.addObserver=Fu(t=>this.observer=t)}get next(){return w(this.observer,this.auth,"internal-error"),this.observer.next.bind(this.observer)}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Ss={async loadJS(){throw new Error("Unable to load external scripts")},recaptchaV2Script:"",recaptchaEnterpriseScript:"",gapiScript:""};function yd(n){Ss=n}function wd(n){return Ss.loadJS(n)}function Ed(){return Ss.gapiScript}function Id(n){return`__${n}${Math.floor(Math.random()*1e6)}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Cd(n,e){const t=ys(n,"auth");if(t.isInitialized()){const s=t.getImmediate(),r=t.getOptions();if($n(r,e??{}))return s;ve(s,"already-initialized")}return t.initialize({options:e})}function bd(n,e){const t=(e==null?void 0:e.persistence)||[],i=(Array.isArray(t)?t:[t]).map(fe);e!=null&&e.errorMap&&n._updateErrorMap(e.errorMap),n._initializeWithPersistence(i,e==null?void 0:e.popupRedirectResolver)}function Sd(n,e,t){const i=ui(n);w(i._canInitEmulator,i,"emulator-config-failed"),w(/^https?:\/\//.test(e),i,"invalid-emulator-scheme");const s=!1,r=Ca(e),{host:o,port:a}=Td(e),c=a===null?"":`:${a}`;i.config.emulator={url:`${r}//${o}${c}/`},i.settings.appVerificationDisabledForTesting=!0,i.emulatorConfig=Object.freeze({host:o,port:a,protocol:r.replace(":",""),options:Object.freeze({disableWarnings:s})}),kd()}function Ca(n){const e=n.indexOf(":");return e<0?"":n.substr(0,e+1)}function Td(n){const e=Ca(n),t=/(\/\/)?([^?#/]+)/.exec(n.substr(e.length));if(!t)return{host:"",port:null};const i=t[2].split("@").pop()||"",s=/^(\[[^\]]+\])(:|$)/.exec(i);if(s){const r=s[1];return{host:r,port:Pr(i.substr(r.length+1))}}else{const[r,o]=i.split(":");return{host:r,port:Pr(o)}}}function Pr(n){if(!n)return null;const e=Number(n);return isNaN(e)?null:e}function kd(){function n(){const e=document.createElement("p"),t=e.style;e.innerText="Running in emulator mode. Do not use with production credentials.",t.position="fixed",t.width="100%",t.backgroundColor="#ffffff",t.border=".1em solid #000000",t.color="#b50000",t.bottom="0px",t.left="0px",t.margin="0px",t.zIndex="10000",t.textAlign="center",e.classList.add("firebase-emulator-warning"),document.body.appendChild(e)}typeof console<"u"&&typeof console.info=="function"&&console.info("WARNING: You are using the Auth Emulator, which is intended for local testing only.  Do not use with production credentials."),typeof window<"u"&&typeof document<"u"&&(document.readyState==="loading"?window.addEventListener("DOMContentLoaded",n):n())}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ba{constructor(e,t){this.providerId=e,this.signInMethod=t}toJSON(){return he("not implemented")}_getIdTokenResponse(e){return he("not implemented")}_linkToIdToken(e,t){return he("not implemented")}_getReauthenticationResolver(e){return he("not implemented")}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function ht(n,e){return la(n,"POST","/v1/accounts:signInWithIdp",li(n,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ad="http://localhost";class Ye extends ba{constructor(){super(...arguments),this.pendingToken=null}static _fromParams(e){const t=new Ye(e.providerId,e.signInMethod);return e.idToken||e.accessToken?(e.idToken&&(t.idToken=e.idToken),e.accessToken&&(t.accessToken=e.accessToken),e.nonce&&!e.pendingToken&&(t.nonce=e.nonce),e.pendingToken&&(t.pendingToken=e.pendingToken)):e.oauthToken&&e.oauthTokenSecret?(t.accessToken=e.oauthToken,t.secret=e.oauthTokenSecret):ve("argument-error"),t}toJSON(){return{idToken:this.idToken,accessToken:this.accessToken,secret:this.secret,nonce:this.nonce,pendingToken:this.pendingToken,providerId:this.providerId,signInMethod:this.signInMethod}}static fromJSON(e){const t=typeof e=="string"?JSON.parse(e):e,{providerId:i,signInMethod:s}=t,r=ws(t,["providerId","signInMethod"]);if(!i||!s)return null;const o=new Ye(i,s);return o.idToken=r.idToken||void 0,o.accessToken=r.accessToken||void 0,o.secret=r.secret,o.nonce=r.nonce,o.pendingToken=r.pendingToken||null,o}_getIdTokenResponse(e){const t=this.buildRequest();return ht(e,t)}_linkToIdToken(e,t){const i=this.buildRequest();return i.idToken=t,ht(e,i)}_getReauthenticationResolver(e){const t=this.buildRequest();return t.autoCreate=!1,ht(e,t)}buildRequest(){const e={requestUri:Ad,returnSecureToken:!0};if(this.pendingToken)e.pendingToken=this.pendingToken;else{const t={};this.idToken&&(t.id_token=this.idToken),this.accessToken&&(t.access_token=this.accessToken),this.secret&&(t.oauth_token_secret=this.secret),t.providerId=this.providerId,this.nonce&&!this.pendingToken&&(t.nonce=this.nonce),e.postBody=It(t)}return e}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Sa{constructor(e){this.providerId=e,this.defaultLanguageCode=null,this.customParameters={}}setDefaultLanguage(e){this.defaultLanguageCode=e}setCustomParameters(e){return this.customParameters=e,this}getCustomParameters(){return this.customParameters}}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class on extends Sa{constructor(){super(...arguments),this.scopes=[]}addScope(e){return this.scopes.includes(e)||this.scopes.push(e),this}getScopes(){return[...this.scopes]}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Se extends on{constructor(){super("facebook.com")}static credential(e){return Ye._fromParams({providerId:Se.PROVIDER_ID,signInMethod:Se.FACEBOOK_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return Se.credentialFromTaggedObject(e)}static credentialFromError(e){return Se.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return Se.credential(e.oauthAccessToken)}catch{return null}}}Se.FACEBOOK_SIGN_IN_METHOD="facebook.com";Se.PROVIDER_ID="facebook.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Te extends on{constructor(){super("google.com"),this.addScope("profile")}static credential(e,t){return Ye._fromParams({providerId:Te.PROVIDER_ID,signInMethod:Te.GOOGLE_SIGN_IN_METHOD,idToken:e,accessToken:t})}static credentialFromResult(e){return Te.credentialFromTaggedObject(e)}static credentialFromError(e){return Te.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthIdToken:t,oauthAccessToken:i}=e;if(!t&&!i)return null;try{return Te.credential(t,i)}catch{return null}}}Te.GOOGLE_SIGN_IN_METHOD="google.com";Te.PROVIDER_ID="google.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ke extends on{constructor(){super("github.com")}static credential(e){return Ye._fromParams({providerId:ke.PROVIDER_ID,signInMethod:ke.GITHUB_SIGN_IN_METHOD,accessToken:e})}static credentialFromResult(e){return ke.credentialFromTaggedObject(e)}static credentialFromError(e){return ke.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e||!("oauthAccessToken"in e)||!e.oauthAccessToken)return null;try{return ke.credential(e.oauthAccessToken)}catch{return null}}}ke.GITHUB_SIGN_IN_METHOD="github.com";ke.PROVIDER_ID="github.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ae extends on{constructor(){super("twitter.com")}static credential(e,t){return Ye._fromParams({providerId:Ae.PROVIDER_ID,signInMethod:Ae.TWITTER_SIGN_IN_METHOD,oauthToken:e,oauthTokenSecret:t})}static credentialFromResult(e){return Ae.credentialFromTaggedObject(e)}static credentialFromError(e){return Ae.credentialFromTaggedObject(e.customData||{})}static credentialFromTaggedObject({_tokenResponse:e}){if(!e)return null;const{oauthAccessToken:t,oauthTokenSecret:i}=e;if(!t||!i)return null;try{return Ae.credential(t,i)}catch{return null}}}Ae.TWITTER_SIGN_IN_METHOD="twitter.com";Ae.PROVIDER_ID="twitter.com";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Rd(n,e){return la(n,"POST","/v1/accounts:signUp",li(n,e))}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Le{constructor(e){this.user=e.user,this.providerId=e.providerId,this._tokenResponse=e._tokenResponse,this.operationType=e.operationType}static async _fromIdTokenResponse(e,t,i,s=!1){const r=await de._fromIdTokenResponse(e,i,s),o=Or(i);return new Le({user:r,providerId:o,_tokenResponse:i,operationType:t})}static async _forOperation(e,t,i){await e._updateTokensIfNecessary(i,!0);const s=Or(i);return new Le({user:e,providerId:s,_tokenResponse:i,operationType:t})}}function Or(n){return n.providerId?n.providerId:"phoneNumber"in n?"phone":null}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Nd(n){var e;if(ue(n.app))return Promise.reject(De(n));const t=ui(n);if(await t._initializationPromise,!((e=t.currentUser)===null||e===void 0)&&e.isAnonymous)return new Le({user:t.currentUser,providerId:null,operationType:"signIn"});const i=await Rd(t,{returnSecureToken:!0}),s=await Le._fromIdTokenResponse(t,"signIn",i,!0);return await t._updateCurrentUser(s.user),s}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vn extends $e{constructor(e,t,i,s){var r;super(t.code,t.message),this.operationType=i,this.user=s,Object.setPrototypeOf(this,Vn.prototype),this.customData={appName:e.name,tenantId:(r=e.tenantId)!==null&&r!==void 0?r:void 0,_serverResponse:t.customData._serverResponse,operationType:i}}static _fromErrorAndOperation(e,t,i,s){return new Vn(e,t,i,s)}}function Ta(n,e,t,i){return(e==="reauthenticate"?t._getReauthenticationResolver(n):t._getIdTokenResponse(n)).catch(r=>{throw r.code==="auth/multi-factor-auth-required"?Vn._fromErrorAndOperation(n,r,e,i):r})}async function Pd(n,e,t=!1){const i=await Yt(n,e._linkToIdToken(n.auth,await n.getIdToken()),t);return Le._forOperation(n,"link",i)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Od(n,e,t=!1){const{auth:i}=n;if(ue(i.app))return Promise.reject(De(i));const s="reauthenticate";try{const r=await Yt(n,Ta(i,s,e,n),t);w(r.idToken,i,"internal-error");const o=Cs(r.idToken);w(o,i,"internal-error");const{sub:a}=o;return w(n.uid===a,i,"user-mismatch"),Le._forOperation(n,s,r)}catch(r){throw(r==null?void 0:r.code)==="auth/user-not-found"&&ve(i,"user-mismatch"),r}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Dd(n,e,t=!1){if(ue(n.app))return Promise.reject(De(n));const i="signIn",s=await Ta(n,i,e),r=await Le._fromIdTokenResponse(n,i,s);return t||await n._updateCurrentUser(r.user),r}function xd(n,e,t,i){return Q(n).onIdTokenChanged(e,t,i)}function Ld(n,e,t){return Q(n).beforeAuthStateChanged(e,t)}function Md(n,e,t,i){return Q(n).onAuthStateChanged(e,t,i)}const qn="__sak";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ka{constructor(e,t){this.storageRetriever=e,this.type=t}_isAvailable(){try{return this.storage?(this.storage.setItem(qn,"1"),this.storage.removeItem(qn),Promise.resolve(!0)):Promise.resolve(!1)}catch{return Promise.resolve(!1)}}_set(e,t){return this.storage.setItem(e,JSON.stringify(t)),Promise.resolve()}_get(e){const t=this.storage.getItem(e);return Promise.resolve(t?JSON.parse(t):null)}_remove(e){return this.storage.removeItem(e),Promise.resolve()}get storage(){return this.storageRetriever()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Fd=1e3,Ud=10;class Aa extends ka{constructor(){super(()=>window.localStorage,"LOCAL"),this.boundEventHandler=(e,t)=>this.onStorageEvent(e,t),this.listeners={},this.localCache={},this.pollTimer=null,this.fallbackToPolling=Ea(),this._shouldAllowMigration=!0}forAllChangedKeys(e){for(const t of Object.keys(this.listeners)){const i=this.storage.getItem(t),s=this.localCache[t];i!==s&&e(t,s,i)}}onStorageEvent(e,t=!1){if(!e.key){this.forAllChangedKeys((o,a,c)=>{this.notifyListeners(o,c)});return}const i=e.key;t?this.detachListener():this.stopPolling();const s=()=>{const o=this.storage.getItem(i);!t&&this.localCache[i]===o||this.notifyListeners(i,o)},r=this.storage.getItem(i);fd()&&r!==e.newValue&&e.newValue!==e.oldValue?setTimeout(s,Ud):s()}notifyListeners(e,t){this.localCache[e]=t;const i=this.listeners[e];if(i)for(const s of Array.from(i))s(t&&JSON.parse(t))}startPolling(){this.stopPolling(),this.pollTimer=setInterval(()=>{this.forAllChangedKeys((e,t,i)=>{this.onStorageEvent(new StorageEvent("storage",{key:e,oldValue:t,newValue:i}),!0)})},Fd)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}attachListener(){window.addEventListener("storage",this.boundEventHandler)}detachListener(){window.removeEventListener("storage",this.boundEventHandler)}_addListener(e,t){Object.keys(this.listeners).length===0&&(this.fallbackToPolling?this.startPolling():this.attachListener()),this.listeners[e]||(this.listeners[e]=new Set,this.localCache[e]=this.storage.getItem(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&(this.detachListener(),this.stopPolling())}async _set(e,t){await super._set(e,t),this.localCache[e]=JSON.stringify(t)}async _get(e){const t=await super._get(e);return this.localCache[e]=JSON.stringify(t),t}async _remove(e){await super._remove(e),delete this.localCache[e]}}Aa.type="LOCAL";const $d=Aa;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ra extends ka{constructor(){super(()=>window.sessionStorage,"SESSION")}_addListener(e,t){}_removeListener(e,t){}}Ra.type="SESSION";const Na=Ra;/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Wd(n){return Promise.all(n.map(async e=>{try{return{fulfilled:!0,value:await e}}catch(t){return{fulfilled:!1,reason:t}}}))}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hi{constructor(e){this.eventTarget=e,this.handlersMap={},this.boundEventHandler=this.handleEvent.bind(this)}static _getInstance(e){const t=this.receivers.find(s=>s.isListeningto(e));if(t)return t;const i=new hi(e);return this.receivers.push(i),i}isListeningto(e){return this.eventTarget===e}async handleEvent(e){const t=e,{eventId:i,eventType:s,data:r}=t.data,o=this.handlersMap[s];if(!(o!=null&&o.size))return;t.ports[0].postMessage({status:"ack",eventId:i,eventType:s});const a=Array.from(o).map(async l=>l(t.origin,r)),c=await Wd(a);t.ports[0].postMessage({status:"done",eventId:i,eventType:s,response:c})}_subscribe(e,t){Object.keys(this.handlersMap).length===0&&this.eventTarget.addEventListener("message",this.boundEventHandler),this.handlersMap[e]||(this.handlersMap[e]=new Set),this.handlersMap[e].add(t)}_unsubscribe(e,t){this.handlersMap[e]&&t&&this.handlersMap[e].delete(t),(!t||this.handlersMap[e].size===0)&&delete this.handlersMap[e],Object.keys(this.handlersMap).length===0&&this.eventTarget.removeEventListener("message",this.boundEventHandler)}}hi.receivers=[];/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Ts(n="",e=10){let t="";for(let i=0;i<e;i++)t+=Math.floor(Math.random()*10);return n+t}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Bd{constructor(e){this.target=e,this.handlers=new Set}removeMessageHandler(e){e.messageChannel&&(e.messageChannel.port1.removeEventListener("message",e.onMessage),e.messageChannel.port1.close()),this.handlers.delete(e)}async _send(e,t,i=50){const s=typeof MessageChannel<"u"?new MessageChannel:null;if(!s)throw new Error("connection_unavailable");let r,o;return new Promise((a,c)=>{const l=Ts("",20);s.port1.start();const h=setTimeout(()=>{c(new Error("unsupported_event"))},i);o={messageChannel:s,onMessage(u){const d=u;if(d.data.eventId===l)switch(d.data.status){case"ack":clearTimeout(h),r=setTimeout(()=>{c(new Error("timeout"))},3e3);break;case"done":clearTimeout(r),a(d.data.response);break;default:clearTimeout(h),clearTimeout(r),c(new Error("invalid_response"));break}}},this.handlers.add(o),s.port1.addEventListener("message",o.onMessage),this.target.postMessage({eventType:e,eventId:l,data:t},[s.port2])}).finally(()=>{o&&this.removeMessageHandler(o)})}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ce(){return window}function Hd(n){ce().location.href=n}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Pa(){return typeof ce().WorkerGlobalScope<"u"&&typeof ce().importScripts=="function"}async function Vd(){if(!(navigator!=null&&navigator.serviceWorker))return null;try{return(await navigator.serviceWorker.ready).active}catch{return null}}function qd(){var n;return((n=navigator==null?void 0:navigator.serviceWorker)===null||n===void 0?void 0:n.controller)||null}function jd(){return Pa()?self:null}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Oa="firebaseLocalStorageDb",zd=1,jn="firebaseLocalStorage",Da="fbase_key";class an{constructor(e){this.request=e}toPromise(){return new Promise((e,t)=>{this.request.addEventListener("success",()=>{e(this.request.result)}),this.request.addEventListener("error",()=>{t(this.request.error)})})}}function di(n,e){return n.transaction([jn],e?"readwrite":"readonly").objectStore(jn)}function Gd(){const n=indexedDB.deleteDatabase(Oa);return new an(n).toPromise()}function Ji(){const n=indexedDB.open(Oa,zd);return new Promise((e,t)=>{n.addEventListener("error",()=>{t(n.error)}),n.addEventListener("upgradeneeded",()=>{const i=n.result;try{i.createObjectStore(jn,{keyPath:Da})}catch(s){t(s)}}),n.addEventListener("success",async()=>{const i=n.result;i.objectStoreNames.contains(jn)?e(i):(i.close(),await Gd(),e(await Ji()))})})}async function Dr(n,e,t){const i=di(n,!0).put({[Da]:e,value:t});return new an(i).toPromise()}async function Kd(n,e){const t=di(n,!1).get(e),i=await new an(t).toPromise();return i===void 0?null:i.value}function xr(n,e){const t=di(n,!0).delete(e);return new an(t).toPromise()}const Yd=800,Qd=3;class xa{constructor(){this.type="LOCAL",this._shouldAllowMigration=!0,this.listeners={},this.localCache={},this.pollTimer=null,this.pendingWrites=0,this.receiver=null,this.sender=null,this.serviceWorkerReceiverAvailable=!1,this.activeServiceWorker=null,this._workerInitializationPromise=this.initializeServiceWorkerMessaging().then(()=>{},()=>{})}async _openDb(){return this.db?this.db:(this.db=await Ji(),this.db)}async _withRetries(e){let t=0;for(;;)try{const i=await this._openDb();return await e(i)}catch(i){if(t++>Qd)throw i;this.db&&(this.db.close(),this.db=void 0)}}async initializeServiceWorkerMessaging(){return Pa()?this.initializeReceiver():this.initializeSender()}async initializeReceiver(){this.receiver=hi._getInstance(jd()),this.receiver._subscribe("keyChanged",async(e,t)=>({keyProcessed:(await this._poll()).includes(t.key)})),this.receiver._subscribe("ping",async(e,t)=>["keyChanged"])}async initializeSender(){var e,t;if(this.activeServiceWorker=await Vd(),!this.activeServiceWorker)return;this.sender=new Bd(this.activeServiceWorker);const i=await this.sender._send("ping",{},800);i&&!((e=i[0])===null||e===void 0)&&e.fulfilled&&!((t=i[0])===null||t===void 0)&&t.value.includes("keyChanged")&&(this.serviceWorkerReceiverAvailable=!0)}async notifyServiceWorker(e){if(!(!this.sender||!this.activeServiceWorker||qd()!==this.activeServiceWorker))try{await this.sender._send("keyChanged",{key:e},this.serviceWorkerReceiverAvailable?800:50)}catch{}}async _isAvailable(){try{if(!indexedDB)return!1;const e=await Ji();return await Dr(e,qn,"1"),await xr(e,qn),!0}catch{}return!1}async _withPendingWrite(e){this.pendingWrites++;try{await e()}finally{this.pendingWrites--}}async _set(e,t){return this._withPendingWrite(async()=>(await this._withRetries(i=>Dr(i,e,t)),this.localCache[e]=t,this.notifyServiceWorker(e)))}async _get(e){const t=await this._withRetries(i=>Kd(i,e));return this.localCache[e]=t,t}async _remove(e){return this._withPendingWrite(async()=>(await this._withRetries(t=>xr(t,e)),delete this.localCache[e],this.notifyServiceWorker(e)))}async _poll(){const e=await this._withRetries(s=>{const r=di(s,!1).getAll();return new an(r).toPromise()});if(!e)return[];if(this.pendingWrites!==0)return[];const t=[],i=new Set;if(e.length!==0)for(const{fbase_key:s,value:r}of e)i.add(s),JSON.stringify(this.localCache[s])!==JSON.stringify(r)&&(this.notifyListeners(s,r),t.push(s));for(const s of Object.keys(this.localCache))this.localCache[s]&&!i.has(s)&&(this.notifyListeners(s,null),t.push(s));return t}notifyListeners(e,t){this.localCache[e]=t;const i=this.listeners[e];if(i)for(const s of Array.from(i))s(t)}startPolling(){this.stopPolling(),this.pollTimer=setInterval(async()=>this._poll(),Yd)}stopPolling(){this.pollTimer&&(clearInterval(this.pollTimer),this.pollTimer=null)}_addListener(e,t){Object.keys(this.listeners).length===0&&this.startPolling(),this.listeners[e]||(this.listeners[e]=new Set,this._get(e)),this.listeners[e].add(t)}_removeListener(e,t){this.listeners[e]&&(this.listeners[e].delete(t),this.listeners[e].size===0&&delete this.listeners[e]),Object.keys(this.listeners).length===0&&this.stopPolling()}}xa.type="LOCAL";const Jd=xa;new rn(3e4,6e4);/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Xd(n,e){return e?fe(e):(w(n._popupRedirectResolver,n,"argument-error"),n._popupRedirectResolver)}/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ks extends ba{constructor(e){super("custom","custom"),this.params=e}_getIdTokenResponse(e){return ht(e,this._buildIdpRequest())}_linkToIdToken(e,t){return ht(e,this._buildIdpRequest(t))}_getReauthenticationResolver(e){return ht(e,this._buildIdpRequest())}_buildIdpRequest(e){const t={requestUri:this.params.requestUri,sessionId:this.params.sessionId,postBody:this.params.postBody,tenantId:this.params.tenantId,pendingToken:this.params.pendingToken,returnSecureToken:!0,returnIdpCredential:!0};return e&&(t.idToken=e),t}}function Zd(n){return Dd(n.auth,new ks(n),n.bypassAuthState)}function ef(n){const{auth:e,user:t}=n;return w(t,e,"internal-error"),Od(t,new ks(n),n.bypassAuthState)}async function tf(n){const{auth:e,user:t}=n;return w(t,e,"internal-error"),Pd(t,new ks(n),n.bypassAuthState)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class La{constructor(e,t,i,s,r=!1){this.auth=e,this.resolver=i,this.user=s,this.bypassAuthState=r,this.pendingPromise=null,this.eventManager=null,this.filter=Array.isArray(t)?t:[t]}execute(){return new Promise(async(e,t)=>{this.pendingPromise={resolve:e,reject:t};try{this.eventManager=await this.resolver._initialize(this.auth),await this.onExecution(),this.eventManager.registerConsumer(this)}catch(i){this.reject(i)}})}async onAuthEvent(e){const{urlResponse:t,sessionId:i,postBody:s,tenantId:r,error:o,type:a}=e;if(o){this.reject(o);return}const c={auth:this.auth,requestUri:t,sessionId:i,tenantId:r||void 0,postBody:s||void 0,user:this.user,bypassAuthState:this.bypassAuthState};try{this.resolve(await this.getIdpTask(a)(c))}catch(l){this.reject(l)}}onError(e){this.reject(e)}getIdpTask(e){switch(e){case"signInViaPopup":case"signInViaRedirect":return Zd;case"linkViaPopup":case"linkViaRedirect":return tf;case"reauthViaPopup":case"reauthViaRedirect":return ef;default:ve(this.auth,"internal-error")}}resolve(e){ye(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.resolve(e),this.unregisterAndCleanUp()}reject(e){ye(this.pendingPromise,"Pending promise was never set"),this.pendingPromise.reject(e),this.unregisterAndCleanUp()}unregisterAndCleanUp(){this.eventManager&&this.eventManager.unregisterConsumer(this),this.pendingPromise=null,this.cleanUp()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nf=new rn(2e3,1e4);class ot extends La{constructor(e,t,i,s,r){super(e,t,s,r),this.provider=i,this.authWindow=null,this.pollId=null,ot.currentPopupAction&&ot.currentPopupAction.cancel(),ot.currentPopupAction=this}async executeNotNull(){const e=await this.execute();return w(e,this.auth,"internal-error"),e}async onExecution(){ye(this.filter.length===1,"Popup operations only handle one event");const e=Ts();this.authWindow=await this.resolver._openPopup(this.auth,this.provider,this.filter[0],e),this.authWindow.associatedEvent=e,this.resolver._originValidation(this.auth).catch(t=>{this.reject(t)}),this.resolver._isIframeWebStorageSupported(this.auth,t=>{t||this.reject(ae(this.auth,"web-storage-unsupported"))}),this.pollUserCancellation()}get eventId(){var e;return((e=this.authWindow)===null||e===void 0?void 0:e.associatedEvent)||null}cancel(){this.reject(ae(this.auth,"cancelled-popup-request"))}cleanUp(){this.authWindow&&this.authWindow.close(),this.pollId&&window.clearTimeout(this.pollId),this.authWindow=null,this.pollId=null,ot.currentPopupAction=null}pollUserCancellation(){const e=()=>{var t,i;if(!((i=(t=this.authWindow)===null||t===void 0?void 0:t.window)===null||i===void 0)&&i.closed){this.pollId=window.setTimeout(()=>{this.pollId=null,this.reject(ae(this.auth,"popup-closed-by-user"))},8e3);return}this.pollId=window.setTimeout(e,nf.get())};e()}}ot.currentPopupAction=null;/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const sf="pendingRedirect",bn=new Map;class rf extends La{constructor(e,t,i=!1){super(e,["signInViaRedirect","linkViaRedirect","reauthViaRedirect","unknown"],t,void 0,i),this.eventId=null}async execute(){let e=bn.get(this.auth._key());if(!e){try{const i=await of(this.resolver,this.auth)?await super.execute():null;e=()=>Promise.resolve(i)}catch(t){e=()=>Promise.reject(t)}bn.set(this.auth._key(),e)}return this.bypassAuthState||bn.set(this.auth._key(),()=>Promise.resolve(null)),e()}async onAuthEvent(e){if(e.type==="signInViaRedirect")return super.onAuthEvent(e);if(e.type==="unknown"){this.resolve(null);return}if(e.eventId){const t=await this.auth._redirectUserForId(e.eventId);if(t)return this.user=t,super.onAuthEvent(e);this.resolve(null)}}async onExecution(){}cleanUp(){}}async function of(n,e){const t=lf(e),i=cf(n);if(!await i._isAvailable())return!1;const s=await i._get(t)==="true";return await i._remove(t),s}function af(n,e){bn.set(n._key(),e)}function cf(n){return fe(n._redirectPersistence)}function lf(n){return Cn(sf,n.config.apiKey,n.name)}async function uf(n,e,t=!1){if(ue(n.app))return Promise.reject(De(n));const i=ui(n),s=Xd(i,e),o=await new rf(i,s,t).execute();return o&&!t&&(delete o.user._redirectEventId,await i._persistUserIfCurrent(o.user),await i._setRedirectUser(null,e)),o}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const hf=10*60*1e3;class df{constructor(e){this.auth=e,this.cachedEventUids=new Set,this.consumers=new Set,this.queuedRedirectEvent=null,this.hasHandledPotentialRedirect=!1,this.lastProcessedEventTime=Date.now()}registerConsumer(e){this.consumers.add(e),this.queuedRedirectEvent&&this.isEventForConsumer(this.queuedRedirectEvent,e)&&(this.sendToConsumer(this.queuedRedirectEvent,e),this.saveEventToCache(this.queuedRedirectEvent),this.queuedRedirectEvent=null)}unregisterConsumer(e){this.consumers.delete(e)}onEvent(e){if(this.hasEventBeenHandled(e))return!1;let t=!1;return this.consumers.forEach(i=>{this.isEventForConsumer(e,i)&&(t=!0,this.sendToConsumer(e,i),this.saveEventToCache(e))}),this.hasHandledPotentialRedirect||!ff(e)||(this.hasHandledPotentialRedirect=!0,t||(this.queuedRedirectEvent=e,t=!0)),t}sendToConsumer(e,t){var i;if(e.error&&!Ma(e)){const s=((i=e.error.code)===null||i===void 0?void 0:i.split("auth/")[1])||"internal-error";t.onError(ae(this.auth,s))}else t.onAuthEvent(e)}isEventForConsumer(e,t){const i=t.eventId===null||!!e.eventId&&e.eventId===t.eventId;return t.filter.includes(e.type)&&i}hasEventBeenHandled(e){return Date.now()-this.lastProcessedEventTime>=hf&&this.cachedEventUids.clear(),this.cachedEventUids.has(Lr(e))}saveEventToCache(e){this.cachedEventUids.add(Lr(e)),this.lastProcessedEventTime=Date.now()}}function Lr(n){return[n.type,n.eventId,n.sessionId,n.tenantId].filter(e=>e).join("-")}function Ma({type:n,error:e}){return n==="unknown"&&(e==null?void 0:e.code)==="auth/no-auth-event"}function ff(n){switch(n.type){case"signInViaRedirect":case"linkViaRedirect":case"reauthViaRedirect":return!0;case"unknown":return Ma(n);default:return!1}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function pf(n,e={}){return bt(n,"GET","/v1/projects",e)}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const mf=/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,_f=/^https?/;async function gf(n){if(n.config.emulator)return;const{authorizedDomains:e}=await pf(n);for(const t of e)try{if(vf(t))return}catch{}ve(n,"unauthorized-domain")}function vf(n){const e=Yi(),{protocol:t,hostname:i}=new URL(e);if(n.startsWith("chrome-extension://")){const o=new URL(n);return o.hostname===""&&i===""?t==="chrome-extension:"&&n.replace("chrome-extension://","")===e.replace("chrome-extension://",""):t==="chrome-extension:"&&o.hostname===i}if(!_f.test(t))return!1;if(mf.test(n))return i===n;const s=n.replace(/\./g,"\\.");return new RegExp("^(.+\\."+s+"|"+s+")$","i").test(i)}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const yf=new rn(3e4,6e4);function Mr(){const n=ce().___jsl;if(n!=null&&n.H){for(const e of Object.keys(n.H))if(n.H[e].r=n.H[e].r||[],n.H[e].L=n.H[e].L||[],n.H[e].r=[...n.H[e].L],n.CP)for(let t=0;t<n.CP.length;t++)n.CP[t]=null}}function wf(n){return new Promise((e,t)=>{var i,s,r;function o(){Mr(),gapi.load("gapi.iframes",{callback:()=>{e(gapi.iframes.getContext())},ontimeout:()=>{Mr(),t(ae(n,"network-request-failed"))},timeout:yf.get()})}if(!((s=(i=ce().gapi)===null||i===void 0?void 0:i.iframes)===null||s===void 0)&&s.Iframe)e(gapi.iframes.getContext());else if(!((r=ce().gapi)===null||r===void 0)&&r.load)o();else{const a=Id("iframefcb");return ce()[a]=()=>{gapi.load?o():t(ae(n,"network-request-failed"))},wd(`${Ed()}?onload=${a}`).catch(c=>t(c))}}).catch(e=>{throw Sn=null,e})}let Sn=null;function Ef(n){return Sn=Sn||wf(n),Sn}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const If=new rn(5e3,15e3),Cf="__/auth/iframe",bf="emulator/auth/iframe",Sf={style:{position:"absolute",top:"-100px",width:"1px",height:"1px"},"aria-hidden":"true",tabindex:"-1"},Tf=new Map([["identitytoolkit.googleapis.com","p"],["staging-identitytoolkit.sandbox.googleapis.com","s"],["test-identitytoolkit.sandbox.googleapis.com","t"]]);function kf(n){const e=n.config;w(e.authDomain,n,"auth-domain-config-required");const t=e.emulator?Is(e,bf):`https://${n.config.authDomain}/${Cf}`,i={apiKey:e.apiKey,appName:n.name,v:Ct},s=Tf.get(n.config.apiHost);s&&(i.eid=s);const r=n._getFrameworks();return r.length&&(i.fw=r.join(",")),`${t}?${It(i).slice(1)}`}async function Af(n){const e=await Ef(n),t=ce().gapi;return w(t,n,"internal-error"),e.open({where:document.body,url:kf(n),messageHandlersFilter:t.iframes.CROSS_ORIGIN_IFRAMES_FILTER,attributes:Sf,dontclear:!0},i=>new Promise(async(s,r)=>{await i.restyle({setHideOnLeave:!1});const o=ae(n,"network-request-failed"),a=ce().setTimeout(()=>{r(o)},If.get());function c(){ce().clearTimeout(a),s(i)}i.ping(c).then(c,()=>{r(o)})}))}/**
 * @license
 * Copyright 2020 Google LLC.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Rf={location:"yes",resizable:"yes",statusbar:"yes",toolbar:"no"},Nf=500,Pf=600,Of="_blank",Df="http://localhost";class Fr{constructor(e){this.window=e,this.associatedEvent=null}close(){if(this.window)try{this.window.close()}catch{}}}function xf(n,e,t,i=Nf,s=Pf){const r=Math.max((window.screen.availHeight-s)/2,0).toString(),o=Math.max((window.screen.availWidth-i)/2,0).toString();let a="";const c=Object.assign(Object.assign({},Rf),{width:i.toString(),height:s.toString(),top:r,left:o}),l=q().toLowerCase();t&&(a=_a(l)?Of:t),pa(l)&&(e=e||Df,c.scrollbars="yes");const h=Object.entries(c).reduce((d,[f,m])=>`${d}${f}=${m},`,"");if(dd(l)&&a!=="_self")return Lf(e||"",a),new Fr(null);const u=window.open(e||"",a,h);w(u,n,"popup-blocked");try{u.focus()}catch{}return new Fr(u)}function Lf(n,e){const t=document.createElement("a");t.href=n,t.target=e;const i=document.createEvent("MouseEvent");i.initMouseEvent("click",!0,!0,window,1,0,0,0,0,!1,!1,!1,!1,1,null),t.dispatchEvent(i)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Mf="__/auth/handler",Ff="emulator/auth/handler",Uf=encodeURIComponent("fac");async function Ur(n,e,t,i,s,r){w(n.config.authDomain,n,"auth-domain-config-required"),w(n.config.apiKey,n,"invalid-api-key");const o={apiKey:n.config.apiKey,appName:n.name,authType:t,redirectUrl:i,v:Ct,eventId:s};if(e instanceof Sa){e.setDefaultLanguage(n.languageCode),o.providerId=e.providerId||"",Vi(e.getCustomParameters())||(o.customParameters=JSON.stringify(e.getCustomParameters()));for(const[h,u]of Object.entries({}))o[h]=u}if(e instanceof on){const h=e.getScopes().filter(u=>u!=="");h.length>0&&(o.scopes=h.join(","))}n.tenantId&&(o.tid=n.tenantId);const a=o;for(const h of Object.keys(a))a[h]===void 0&&delete a[h];const c=await n._getAppCheckToken(),l=c?`#${Uf}=${encodeURIComponent(c)}`:"";return`${$f(n)}?${It(a).slice(1)}${l}`}function $f({config:n}){return n.emulator?Is(n,Ff):`https://${n.authDomain}/${Mf}`}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ni="webStorageSupport";class Wf{constructor(){this.eventManagers={},this.iframes={},this.originValidationPromises={},this._redirectPersistence=Na,this._completeRedirectFn=uf,this._overrideRedirectResult=af}async _openPopup(e,t,i,s){var r;ye((r=this.eventManagers[e._key()])===null||r===void 0?void 0:r.manager,"_initialize() not called before _openPopup()");const o=await Ur(e,t,i,Yi(),s);return xf(e,o,Ts())}async _openRedirect(e,t,i,s){await this._originValidation(e);const r=await Ur(e,t,i,Yi(),s);return Hd(r),new Promise(()=>{})}_initialize(e){const t=e._key();if(this.eventManagers[t]){const{manager:s,promise:r}=this.eventManagers[t];return s?Promise.resolve(s):(ye(r,"If manager is not set, promise should be"),r)}const i=this.initAndGetManager(e);return this.eventManagers[t]={promise:i},i.catch(()=>{delete this.eventManagers[t]}),i}async initAndGetManager(e){const t=await Af(e),i=new df(e);return t.register("authEvent",s=>(w(s==null?void 0:s.authEvent,e,"invalid-auth-event"),{status:i.onEvent(s.authEvent)?"ACK":"ERROR"}),gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER),this.eventManagers[e._key()]={manager:i},this.iframes[e._key()]=t,i}_isIframeWebStorageSupported(e,t){this.iframes[e._key()].send(Ni,{type:Ni},s=>{var r;const o=(r=s==null?void 0:s[0])===null||r===void 0?void 0:r[Ni];o!==void 0&&t(!!o),ve(e,"internal-error")},gapi.iframes.CROSS_ORIGIN_IFRAMES_FILTER)}_originValidation(e){const t=e._key();return this.originValidationPromises[t]||(this.originValidationPromises[t]=gf(e)),this.originValidationPromises[t]}get _shouldInitProactively(){return Ea()||ma()||bs()}}const Bf=Wf;var $r="@firebase/auth",Wr="1.7.9";/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Hf{constructor(e){this.auth=e,this.internalListeners=new Map}getUid(){var e;return this.assertAuthConfigured(),((e=this.auth.currentUser)===null||e===void 0?void 0:e.uid)||null}async getToken(e){return this.assertAuthConfigured(),await this.auth._initializationPromise,this.auth.currentUser?{accessToken:await this.auth.currentUser.getIdToken(e)}:null}addAuthTokenListener(e){if(this.assertAuthConfigured(),this.internalListeners.has(e))return;const t=this.auth.onIdTokenChanged(i=>{e((i==null?void 0:i.stsTokenManager.accessToken)||null)});this.internalListeners.set(e,t),this.updateProactiveRefresh()}removeAuthTokenListener(e){this.assertAuthConfigured();const t=this.internalListeners.get(e);t&&(this.internalListeners.delete(e),t(),this.updateProactiveRefresh())}assertAuthConfigured(){w(this.auth._initializationPromise,"dependent-sdk-initialized-before-auth")}updateProactiveRefresh(){this.internalListeners.size>0?this.auth._startProactiveRefresh():this.auth._stopProactiveRefresh()}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Vf(n){switch(n){case"Node":return"node";case"ReactNative":return"rn";case"Worker":return"webworker";case"Cordova":return"cordova";case"WebExtension":return"web-extension";default:return}}function qf(n){_t(new Ke("auth",(e,{options:t})=>{const i=e.getProvider("app").getImmediate(),s=e.getProvider("heartbeat"),r=e.getProvider("app-check-internal"),{apiKey:o,authDomain:a}=i.options;w(o&&!o.includes(":"),"invalid-api-key",{appName:i.name});const c={apiKey:o,authDomain:a,clientPlatform:n,apiHost:"identitytoolkit.googleapis.com",tokenApiHost:"securetoken.googleapis.com",apiScheme:"https",sdkClientVersion:Ia(n)},l=new vd(i,s,r,c);return bd(l,t),l},"PUBLIC").setInstantiationMode("EXPLICIT").setInstanceCreatedCallback((e,t,i)=>{e.getProvider("auth-internal").initialize()})),_t(new Ke("auth-internal",e=>{const t=ui(e.getProvider("auth").getImmediate());return(i=>new Hf(i))(t)},"PRIVATE").setInstantiationMode("EXPLICIT")),Oe($r,Wr,Vf(n)),Oe($r,Wr,"esm2017")}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const jf=5*60,zf=Yo("authIdTokenMaxAge")||jf;let Br=null;const Gf=n=>async e=>{const t=e&&await e.getIdTokenResult(),i=t&&(new Date().getTime()-Date.parse(t.issuedAtTime))/1e3;if(i&&i>zf)return;const s=t==null?void 0:t.token;Br!==s&&(Br=s,await fetch(n,{method:s?"POST":"DELETE",headers:s?{Authorization:`Bearer ${s}`}:{}}))};function Kf(n=ta()){const e=ys(n,"auth");if(e.isInitialized())return e.getImmediate();const t=Cd(n,{popupRedirectResolver:Bf,persistence:[Jd,$d,Na]}),i=Yo("authTokenSyncURL");if(i&&typeof isSecureContext=="boolean"&&isSecureContext){const r=new URL(i,location.origin);if(location.origin===r.origin){const o=Gf(r.toString());Ld(t,o,()=>o(t.currentUser)),xd(t,a=>o(a))}}const s=Go("auth");return s&&Sd(t,`http://${s}`),t}function Yf(){var n,e;return(e=(n=document.getElementsByTagName("head"))===null||n===void 0?void 0:n[0])!==null&&e!==void 0?e:document}yd({loadJS(n){return new Promise((e,t)=>{const i=document.createElement("script");i.setAttribute("src",n),i.onload=e,i.onerror=s=>{const r=ae("internal-error");r.customData=s,t(r)},i.type="text/javascript",i.charset="UTF-8",Yf().appendChild(i)})},gapiScript:"https://apis.google.com/js/api.js",recaptchaV2Script:"https://www.google.com/recaptcha/api.js",recaptchaEnterpriseScript:"https://www.google.com/recaptcha/enterprise.js?render="});qf("Browser");var Hr={};const Vr="@firebase/database",qr="1.0.8";/**
 * @license
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Fa="";function Qf(n){Fa=n}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jf{constructor(e){this.domStorage_=e,this.prefix_="firebase:"}set(e,t){t==null?this.domStorage_.removeItem(this.prefixedName_(e)):this.domStorage_.setItem(this.prefixedName_(e),W(t))}get(e){const t=this.domStorage_.getItem(this.prefixedName_(e));return t==null?null:Gt(t)}remove(e){this.domStorage_.removeItem(this.prefixedName_(e))}prefixedName_(e){return this.prefix_+e}toString(){return this.domStorage_.toString()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xf{constructor(){this.cache_={},this.isInMemoryStorage=!0}set(e,t){t==null?delete this.cache_[e]:this.cache_[e]=t}get(e){return Ie(this.cache_,e)?this.cache_[e]:null}remove(e){delete this.cache_[e]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ua=function(n){try{if(typeof window<"u"&&typeof window[n]<"u"){const e=window[n];return e.setItem("firebase:sentinel","cache"),e.removeItem("firebase:sentinel"),new Jf(e)}}catch{}return new Xf},qe=Ua("localStorage"),Zf=Ua("sessionStorage");/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const dt=new gs("@firebase/database"),ep=function(){let n=1;return function(){return n++}}(),$a=function(n){const e=Wu(n),t=new Mu;t.update(e);const i=t.digest();return fs.encodeByteArray(i)},cn=function(...n){let e="";for(let t=0;t<n.length;t++){const i=n[t];Array.isArray(i)||i&&typeof i=="object"&&typeof i.length=="number"?e+=cn.apply(null,i):typeof i=="object"?e+=W(i):e+=i,e+=" "}return e};let $t=null,jr=!0;const tp=function(n,e){_(!0,"Can't turn on custom loggers persistently."),dt.logLevel=T.VERBOSE,$t=dt.log.bind(dt)},H=function(...n){if(jr===!0&&(jr=!1,$t===null&&Zf.get("logging_enabled")===!0&&tp()),$t){const e=cn.apply(null,n);$t(e)}},ln=function(n){return function(...e){H(n,...e)}},Xi=function(...n){const e="FIREBASE INTERNAL ERROR: "+cn(...n);dt.error(e)},we=function(...n){const e=`FIREBASE FATAL ERROR: ${cn(...n)}`;throw dt.error(e),new Error(e)},G=function(...n){const e="FIREBASE WARNING: "+cn(...n);dt.warn(e)},np=function(){typeof window<"u"&&window.location&&window.location.protocol&&window.location.protocol.indexOf("https:")!==-1&&G("Insecure Firebase access from a secure page. Please use https in calls to new Firebase().")},Wa=function(n){return typeof n=="number"&&(n!==n||n===Number.POSITIVE_INFINITY||n===Number.NEGATIVE_INFINITY)},ip=function(n){if(document.readyState==="complete")n();else{let e=!1;const t=function(){if(!document.body){setTimeout(t,Math.floor(10));return}e||(e=!0,n())};document.addEventListener?(document.addEventListener("DOMContentLoaded",t,!1),window.addEventListener("load",t,!1)):document.attachEvent&&(document.attachEvent("onreadystatechange",()=>{document.readyState==="complete"&&t()}),window.attachEvent("onload",t))}},gt="[MIN_NAME]",Qe="[MAX_NAME]",St=function(n,e){if(n===e)return 0;if(n===gt||e===Qe)return-1;if(e===gt||n===Qe)return 1;{const t=zr(n),i=zr(e);return t!==null?i!==null?t-i===0?n.length-e.length:t-i:-1:i!==null?1:n<e?-1:1}},sp=function(n,e){return n===e?0:n<e?-1:1},Pt=function(n,e){if(e&&n in e)return e[n];throw new Error("Missing required key ("+n+") in object: "+W(e))},As=function(n){if(typeof n!="object"||n===null)return W(n);const e=[];for(const i in n)e.push(i);e.sort();let t="{";for(let i=0;i<e.length;i++)i!==0&&(t+=","),t+=W(e[i]),t+=":",t+=As(n[e[i]]);return t+="}",t},Ba=function(n,e){const t=n.length;if(t<=e)return[n];const i=[];for(let s=0;s<t;s+=e)s+e>t?i.push(n.substring(s,t)):i.push(n.substring(s,s+e));return i};function K(n,e){for(const t in n)n.hasOwnProperty(t)&&e(t,n[t])}const Ha=function(n){_(!Wa(n),"Invalid JSON number");const e=11,t=52,i=(1<<e-1)-1;let s,r,o,a,c;n===0?(r=0,o=0,s=1/n===-1/0?1:0):(s=n<0,n=Math.abs(n),n>=Math.pow(2,1-i)?(a=Math.min(Math.floor(Math.log(n)/Math.LN2),i),r=a+i,o=Math.round(n*Math.pow(2,t-a)-Math.pow(2,t))):(r=0,o=Math.round(n/Math.pow(2,1-i-t))));const l=[];for(c=t;c;c-=1)l.push(o%2?1:0),o=Math.floor(o/2);for(c=e;c;c-=1)l.push(r%2?1:0),r=Math.floor(r/2);l.push(s?1:0),l.reverse();const h=l.join("");let u="";for(c=0;c<64;c+=8){let d=parseInt(h.substr(c,8),2).toString(16);d.length===1&&(d="0"+d),u=u+d}return u.toLowerCase()},rp=function(){return!!(typeof window=="object"&&window.chrome&&window.chrome.extension&&!/^chrome/.test(window.location.href))},op=function(){return typeof Windows=="object"&&typeof Windows.UI=="object"};function ap(n,e){let t="Unknown Error";n==="too_big"?t="The data requested exceeds the maximum size that can be accessed with a single request.":n==="permission_denied"?t="Client doesn't have permission to access the desired data.":n==="unavailable"&&(t="The service is unavailable");const i=new Error(n+" at "+e._path.toString()+": "+t);return i.code=n.toUpperCase(),i}const cp=new RegExp("^-?(0*)\\d{1,10}$"),lp=-2147483648,up=2147483647,zr=function(n){if(cp.test(n)){const e=Number(n);if(e>=lp&&e<=up)return e}return null},Tt=function(n){try{n()}catch(e){setTimeout(()=>{const t=e.stack||"";throw G("Exception was thrown by user callback.",t),e},Math.floor(0))}},hp=function(){return(typeof window=="object"&&window.navigator&&window.navigator.userAgent||"").search(/googlebot|google webmaster tools|bingbot|yahoo! slurp|baiduspider|yandexbot|duckduckbot/i)>=0},Wt=function(n,e){const t=setTimeout(n,e);return typeof t=="number"&&typeof Deno<"u"&&Deno.unrefTimer?Deno.unrefTimer(t):typeof t=="object"&&t.unref&&t.unref(),t};/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class dp{constructor(e,t){this.appName_=e,this.appCheckProvider=t,this.appCheck=t==null?void 0:t.getImmediate({optional:!0}),this.appCheck||t==null||t.get().then(i=>this.appCheck=i)}getToken(e){return this.appCheck?this.appCheck.getToken(e):new Promise((t,i)=>{setTimeout(()=>{this.appCheck?this.getToken(e).then(t,i):t(null)},0)})}addTokenChangeListener(e){var t;(t=this.appCheckProvider)===null||t===void 0||t.get().then(i=>i.addTokenListener(e))}notifyForInvalidToken(){G(`Provided AppCheck credentials for the app named "${this.appName_}" are invalid. This usually indicates your app was not initialized correctly.`)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fp{constructor(e,t,i){this.appName_=e,this.firebaseOptions_=t,this.authProvider_=i,this.auth_=null,this.auth_=i.getImmediate({optional:!0}),this.auth_||i.onInit(s=>this.auth_=s)}getToken(e){return this.auth_?this.auth_.getToken(e).catch(t=>t&&t.code==="auth/token-not-initialized"?(H("Got auth/token-not-initialized error.  Treating as null token."),null):Promise.reject(t)):new Promise((t,i)=>{setTimeout(()=>{this.auth_?this.getToken(e).then(t,i):t(null)},0)})}addTokenChangeListener(e){this.auth_?this.auth_.addAuthTokenListener(e):this.authProvider_.get().then(t=>t.addAuthTokenListener(e))}removeTokenChangeListener(e){this.authProvider_.get().then(t=>t.removeAuthTokenListener(e))}notifyForInvalidToken(){let e='Provided authentication credentials for the app named "'+this.appName_+'" are invalid. This usually indicates your app was not initialized correctly. ';"credential"in this.firebaseOptions_?e+='Make sure the "credential" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':"serviceAccount"in this.firebaseOptions_?e+='Make sure the "serviceAccount" property provided to initializeApp() is authorized to access the specified "databaseURL" and is from the correct project.':e+='Make sure the "apiKey" and "databaseURL" properties provided to initializeApp() match the values provided for your app at https://console.firebase.google.com/.',G(e)}}class Tn{constructor(e){this.accessToken=e}getToken(e){return Promise.resolve({accessToken:this.accessToken})}addTokenChangeListener(e){e(this.accessToken)}removeTokenChangeListener(e){}notifyForInvalidToken(){}}Tn.OWNER="owner";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Rs="5",Va="v",qa="s",ja="r",za="f",Ga=/(console\.firebase|firebase-console-\w+\.corp|firebase\.corp)\.google\.com/,Ka="ls",Ya="p",Zi="ac",Qa="websocket",Ja="long_polling";/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xa{constructor(e,t,i,s,r=!1,o="",a=!1,c=!1){this.secure=t,this.namespace=i,this.webSocketOnly=s,this.nodeAdmin=r,this.persistenceKey=o,this.includeNamespaceInQueryParams=a,this.isUsingEmulator=c,this._host=e.toLowerCase(),this._domain=this._host.substr(this._host.indexOf(".")+1),this.internalHost=qe.get("host:"+e)||this._host}isCacheableHost(){return this.internalHost.substr(0,2)==="s-"}isCustomHost(){return this._domain!=="firebaseio.com"&&this._domain!=="firebaseio-demo.com"}get host(){return this._host}set host(e){e!==this.internalHost&&(this.internalHost=e,this.isCacheableHost()&&qe.set("host:"+this._host,this.internalHost))}toString(){let e=this.toURLString();return this.persistenceKey&&(e+="<"+this.persistenceKey+">"),e}toURLString(){const e=this.secure?"https://":"http://",t=this.includeNamespaceInQueryParams?`?ns=${this.namespace}`:"";return`${e}${this.host}/${t}`}}function pp(n){return n.host!==n.internalHost||n.isCustomHost()||n.includeNamespaceInQueryParams}function Za(n,e,t){_(typeof e=="string","typeof type must == string"),_(typeof t=="object","typeof params must == object");let i;if(e===Qa)i=(n.secure?"wss://":"ws://")+n.internalHost+"/.ws?";else if(e===Ja)i=(n.secure?"https://":"http://")+n.internalHost+"/.lp?";else throw new Error("Unknown connection type: "+e);pp(n)&&(t.ns=n.namespace);const s=[];return K(t,(r,o)=>{s.push(r+"="+o)}),i+s.join("&")}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mp{constructor(){this.counters_={}}incrementCounter(e,t=1){Ie(this.counters_,e)||(this.counters_[e]=0),this.counters_[e]+=t}get(){return gu(this.counters_)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pi={},Oi={};function Ns(n){const e=n.toString();return Pi[e]||(Pi[e]=new mp),Pi[e]}function _p(n,e){const t=n.toString();return Oi[t]||(Oi[t]=e()),Oi[t]}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class gp{constructor(e){this.onMessage_=e,this.pendingResponses=[],this.currentResponseNum=0,this.closeAfterResponse=-1,this.onClose=null}closeAfter(e,t){this.closeAfterResponse=e,this.onClose=t,this.closeAfterResponse<this.currentResponseNum&&(this.onClose(),this.onClose=null)}handleResponse(e,t){for(this.pendingResponses[e]=t;this.pendingResponses[this.currentResponseNum];){const i=this.pendingResponses[this.currentResponseNum];delete this.pendingResponses[this.currentResponseNum];for(let s=0;s<i.length;++s)i[s]&&Tt(()=>{this.onMessage_(i[s])});if(this.currentResponseNum===this.closeAfterResponse){this.onClose&&(this.onClose(),this.onClose=null);break}this.currentResponseNum++}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Gr="start",vp="close",yp="pLPCommand",wp="pRTLPCB",ec="id",tc="pw",nc="ser",Ep="cb",Ip="seg",Cp="ts",bp="d",Sp="dframe",ic=1870,sc=30,Tp=ic-sc,kp=25e3,Ap=3e4;class at{constructor(e,t,i,s,r,o,a){this.connId=e,this.repoInfo=t,this.applicationId=i,this.appCheckToken=s,this.authToken=r,this.transportSessionId=o,this.lastSessionId=a,this.bytesSent=0,this.bytesReceived=0,this.everConnected_=!1,this.log_=ln(e),this.stats_=Ns(t),this.urlFn=c=>(this.appCheckToken&&(c[Zi]=this.appCheckToken),Za(t,Ja,c))}open(e,t){this.curSegmentNum=0,this.onDisconnect_=t,this.myPacketOrderer=new gp(e),this.isClosed_=!1,this.connectTimeoutTimer_=setTimeout(()=>{this.log_("Timed out trying to connect."),this.onClosed_(),this.connectTimeoutTimer_=null},Math.floor(Ap)),ip(()=>{if(this.isClosed_)return;this.scriptTagHolder=new Ps((...r)=>{const[o,a,c,l,h]=r;if(this.incrementIncomingBytes_(r),!!this.scriptTagHolder)if(this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null),this.everConnected_=!0,o===Gr)this.id=a,this.password=c;else if(o===vp)a?(this.scriptTagHolder.sendNewPolls=!1,this.myPacketOrderer.closeAfter(a,()=>{this.onClosed_()})):this.onClosed_();else throw new Error("Unrecognized command received: "+o)},(...r)=>{const[o,a]=r;this.incrementIncomingBytes_(r),this.myPacketOrderer.handleResponse(o,a)},()=>{this.onClosed_()},this.urlFn);const i={};i[Gr]="t",i[nc]=Math.floor(Math.random()*1e8),this.scriptTagHolder.uniqueCallbackIdentifier&&(i[Ep]=this.scriptTagHolder.uniqueCallbackIdentifier),i[Va]=Rs,this.transportSessionId&&(i[qa]=this.transportSessionId),this.lastSessionId&&(i[Ka]=this.lastSessionId),this.applicationId&&(i[Ya]=this.applicationId),this.appCheckToken&&(i[Zi]=this.appCheckToken),typeof location<"u"&&location.hostname&&Ga.test(location.hostname)&&(i[ja]=za);const s=this.urlFn(i);this.log_("Connecting via long-poll to "+s),this.scriptTagHolder.addTag(s,()=>{})})}start(){this.scriptTagHolder.startLongPoll(this.id,this.password),this.addDisconnectPingFrame(this.id,this.password)}static forceAllow(){at.forceAllow_=!0}static forceDisallow(){at.forceDisallow_=!0}static isAvailable(){return at.forceAllow_?!0:!at.forceDisallow_&&typeof document<"u"&&document.createElement!=null&&!rp()&&!op()}markConnectionHealthy(){}shutdown_(){this.isClosed_=!0,this.scriptTagHolder&&(this.scriptTagHolder.close(),this.scriptTagHolder=null),this.myDisconnFrame&&(document.body.removeChild(this.myDisconnFrame),this.myDisconnFrame=null),this.connectTimeoutTimer_&&(clearTimeout(this.connectTimeoutTimer_),this.connectTimeoutTimer_=null)}onClosed_(){this.isClosed_||(this.log_("Longpoll is closing itself"),this.shutdown_(),this.onDisconnect_&&(this.onDisconnect_(this.everConnected_),this.onDisconnect_=null))}close(){this.isClosed_||(this.log_("Longpoll is being closed."),this.shutdown_())}send(e){const t=W(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const i=jo(t),s=Ba(i,Tp);for(let r=0;r<s.length;r++)this.scriptTagHolder.enqueueSegment(this.curSegmentNum,s.length,s[r]),this.curSegmentNum++}addDisconnectPingFrame(e,t){this.myDisconnFrame=document.createElement("iframe");const i={};i[Sp]="t",i[ec]=e,i[tc]=t,this.myDisconnFrame.src=this.urlFn(i),this.myDisconnFrame.style.display="none",document.body.appendChild(this.myDisconnFrame)}incrementIncomingBytes_(e){const t=W(e).length;this.bytesReceived+=t,this.stats_.incrementCounter("bytes_received",t)}}class Ps{constructor(e,t,i,s){this.onDisconnect=i,this.urlFn=s,this.outstandingRequests=new Set,this.pendingSegs=[],this.currentSerial=Math.floor(Math.random()*1e8),this.sendNewPolls=!0;{this.uniqueCallbackIdentifier=ep(),window[yp+this.uniqueCallbackIdentifier]=e,window[wp+this.uniqueCallbackIdentifier]=t,this.myIFrame=Ps.createIFrame_();let r="";this.myIFrame.src&&this.myIFrame.src.substr(0,11)==="javascript:"&&(r='<script>document.domain="'+document.domain+'";<\/script>');const o="<html><body>"+r+"</body></html>";try{this.myIFrame.doc.open(),this.myIFrame.doc.write(o),this.myIFrame.doc.close()}catch(a){H("frame writing exception"),a.stack&&H(a.stack),H(a)}}}static createIFrame_(){const e=document.createElement("iframe");if(e.style.display="none",document.body){document.body.appendChild(e);try{e.contentWindow.document||H("No IE domain setting required")}catch{const i=document.domain;e.src="javascript:void((function(){document.open();document.domain='"+i+"';document.close();})())"}}else throw"Document body has not initialized. Wait to initialize Firebase until after the document is ready.";return e.contentDocument?e.doc=e.contentDocument:e.contentWindow?e.doc=e.contentWindow.document:e.document&&(e.doc=e.document),e}close(){this.alive=!1,this.myIFrame&&(this.myIFrame.doc.body.textContent="",setTimeout(()=>{this.myIFrame!==null&&(document.body.removeChild(this.myIFrame),this.myIFrame=null)},Math.floor(0)));const e=this.onDisconnect;e&&(this.onDisconnect=null,e())}startLongPoll(e,t){for(this.myID=e,this.myPW=t,this.alive=!0;this.newRequest_(););}newRequest_(){if(this.alive&&this.sendNewPolls&&this.outstandingRequests.size<(this.pendingSegs.length>0?2:1)){this.currentSerial++;const e={};e[ec]=this.myID,e[tc]=this.myPW,e[nc]=this.currentSerial;let t=this.urlFn(e),i="",s=0;for(;this.pendingSegs.length>0&&this.pendingSegs[0].d.length+sc+i.length<=ic;){const o=this.pendingSegs.shift();i=i+"&"+Ip+s+"="+o.seg+"&"+Cp+s+"="+o.ts+"&"+bp+s+"="+o.d,s++}return t=t+i,this.addLongPollTag_(t,this.currentSerial),!0}else return!1}enqueueSegment(e,t,i){this.pendingSegs.push({seg:e,ts:t,d:i}),this.alive&&this.newRequest_()}addLongPollTag_(e,t){this.outstandingRequests.add(t);const i=()=>{this.outstandingRequests.delete(t),this.newRequest_()},s=setTimeout(i,Math.floor(kp)),r=()=>{clearTimeout(s),i()};this.addTag(e,r)}addTag(e,t){setTimeout(()=>{try{if(!this.sendNewPolls)return;const i=this.myIFrame.doc.createElement("script");i.type="text/javascript",i.async=!0,i.src=e,i.onload=i.onreadystatechange=function(){const s=i.readyState;(!s||s==="loaded"||s==="complete")&&(i.onload=i.onreadystatechange=null,i.parentNode&&i.parentNode.removeChild(i),t())},i.onerror=()=>{H("Long-poll script failed to load: "+e),this.sendNewPolls=!1,this.close()},this.myIFrame.doc.body.appendChild(i)}catch{}},Math.floor(1))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Rp=16384,Np=45e3;let zn=null;typeof MozWebSocket<"u"?zn=MozWebSocket:typeof WebSocket<"u"&&(zn=WebSocket);class Z{constructor(e,t,i,s,r,o,a){this.connId=e,this.applicationId=i,this.appCheckToken=s,this.authToken=r,this.keepaliveTimer=null,this.frames=null,this.totalFrames=0,this.bytesSent=0,this.bytesReceived=0,this.log_=ln(this.connId),this.stats_=Ns(t),this.connURL=Z.connectionURL_(t,o,a,s,i),this.nodeAdmin=t.nodeAdmin}static connectionURL_(e,t,i,s,r){const o={};return o[Va]=Rs,typeof location<"u"&&location.hostname&&Ga.test(location.hostname)&&(o[ja]=za),t&&(o[qa]=t),i&&(o[Ka]=i),s&&(o[Zi]=s),r&&(o[Ya]=r),Za(e,Qa,o)}open(e,t){this.onDisconnect=t,this.onMessage=e,this.log_("Websocket connecting to "+this.connURL),this.everConnected_=!1,qe.set("previous_websocket_failure",!0);try{let i;Au(),this.mySock=new zn(this.connURL,[],i)}catch(i){this.log_("Error instantiating WebSocket.");const s=i.message||i.data;s&&this.log_(s),this.onClosed_();return}this.mySock.onopen=()=>{this.log_("Websocket connected."),this.everConnected_=!0},this.mySock.onclose=()=>{this.log_("Websocket connection was disconnected."),this.mySock=null,this.onClosed_()},this.mySock.onmessage=i=>{this.handleIncomingFrame(i)},this.mySock.onerror=i=>{this.log_("WebSocket error.  Closing connection.");const s=i.message||i.data;s&&this.log_(s),this.onClosed_()}}start(){}static forceDisallow(){Z.forceDisallow_=!0}static isAvailable(){let e=!1;if(typeof navigator<"u"&&navigator.userAgent){const t=/Android ([0-9]{0,}\.[0-9]{0,})/,i=navigator.userAgent.match(t);i&&i.length>1&&parseFloat(i[1])<4.4&&(e=!0)}return!e&&zn!==null&&!Z.forceDisallow_}static previouslyFailed(){return qe.isInMemoryStorage||qe.get("previous_websocket_failure")===!0}markConnectionHealthy(){qe.remove("previous_websocket_failure")}appendFrame_(e){if(this.frames.push(e),this.frames.length===this.totalFrames){const t=this.frames.join("");this.frames=null;const i=Gt(t);this.onMessage(i)}}handleNewFrameCount_(e){this.totalFrames=e,this.frames=[]}extractFrameCount_(e){if(_(this.frames===null,"We already have a frame buffer"),e.length<=6){const t=Number(e);if(!isNaN(t))return this.handleNewFrameCount_(t),null}return this.handleNewFrameCount_(1),e}handleIncomingFrame(e){if(this.mySock===null)return;const t=e.data;if(this.bytesReceived+=t.length,this.stats_.incrementCounter("bytes_received",t.length),this.resetKeepAlive(),this.frames!==null)this.appendFrame_(t);else{const i=this.extractFrameCount_(t);i!==null&&this.appendFrame_(i)}}send(e){this.resetKeepAlive();const t=W(e);this.bytesSent+=t.length,this.stats_.incrementCounter("bytes_sent",t.length);const i=Ba(t,Rp);i.length>1&&this.sendString_(String(i.length));for(let s=0;s<i.length;s++)this.sendString_(i[s])}shutdown_(){this.isClosed_=!0,this.keepaliveTimer&&(clearInterval(this.keepaliveTimer),this.keepaliveTimer=null),this.mySock&&(this.mySock.close(),this.mySock=null)}onClosed_(){this.isClosed_||(this.log_("WebSocket is closing itself"),this.shutdown_(),this.onDisconnect&&(this.onDisconnect(this.everConnected_),this.onDisconnect=null))}close(){this.isClosed_||(this.log_("WebSocket is being closed"),this.shutdown_())}resetKeepAlive(){clearInterval(this.keepaliveTimer),this.keepaliveTimer=setInterval(()=>{this.mySock&&this.sendString_("0"),this.resetKeepAlive()},Math.floor(Np))}sendString_(e){try{this.mySock.send(e)}catch(t){this.log_("Exception thrown from WebSocket.send():",t.message||t.data,"Closing connection."),setTimeout(this.onClosed_.bind(this),0)}}}Z.responsesRequiredToBeHealthy=2;Z.healthyTimeout=3e4;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Qt{constructor(e){this.initTransports_(e)}static get ALL_TRANSPORTS(){return[at,Z]}static get IS_TRANSPORT_INITIALIZED(){return this.globalTransportInitialized_}initTransports_(e){const t=Z&&Z.isAvailable();let i=t&&!Z.previouslyFailed();if(e.webSocketOnly&&(t||G("wss:// URL used, but browser isn't known to support websockets.  Trying anyway."),i=!0),i)this.transports_=[Z];else{const s=this.transports_=[];for(const r of Qt.ALL_TRANSPORTS)r&&r.isAvailable()&&s.push(r);Qt.globalTransportInitialized_=!0}}initialTransport(){if(this.transports_.length>0)return this.transports_[0];throw new Error("No transports available")}upgradeTransport(){return this.transports_.length>1?this.transports_[1]:null}}Qt.globalTransportInitialized_=!1;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Pp=6e4,Op=5e3,Dp=10*1024,xp=100*1024,Di="t",Kr="d",Lp="s",Yr="r",Mp="e",Qr="o",Jr="a",Xr="n",Zr="p",Fp="h";class Up{constructor(e,t,i,s,r,o,a,c,l,h){this.id=e,this.repoInfo_=t,this.applicationId_=i,this.appCheckToken_=s,this.authToken_=r,this.onMessage_=o,this.onReady_=a,this.onDisconnect_=c,this.onKill_=l,this.lastSessionId=h,this.connectionCount=0,this.pendingDataMessages=[],this.state_=0,this.log_=ln("c:"+this.id+":"),this.transportManager_=new Qt(t),this.log_("Connection created"),this.start_()}start_(){const e=this.transportManager_.initialTransport();this.conn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,null,this.lastSessionId),this.primaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.conn_),i=this.disconnReceiver_(this.conn_);this.tx_=this.conn_,this.rx_=this.conn_,this.secondaryConn_=null,this.isHealthy_=!1,setTimeout(()=>{this.conn_&&this.conn_.open(t,i)},Math.floor(0));const s=e.healthyTimeout||0;s>0&&(this.healthyTimeout_=Wt(()=>{this.healthyTimeout_=null,this.isHealthy_||(this.conn_&&this.conn_.bytesReceived>xp?(this.log_("Connection exceeded healthy timeout but has received "+this.conn_.bytesReceived+" bytes.  Marking connection healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()):this.conn_&&this.conn_.bytesSent>Dp?this.log_("Connection exceeded healthy timeout but has sent "+this.conn_.bytesSent+" bytes.  Leaving connection alive."):(this.log_("Closing unhealthy connection after timeout."),this.close()))},Math.floor(s)))}nextTransportId_(){return"c:"+this.id+":"+this.connectionCount++}disconnReceiver_(e){return t=>{e===this.conn_?this.onConnectionLost_(t):e===this.secondaryConn_?(this.log_("Secondary connection lost."),this.onSecondaryConnectionLost_()):this.log_("closing an old connection")}}connReceiver_(e){return t=>{this.state_!==2&&(e===this.rx_?this.onPrimaryMessageReceived_(t):e===this.secondaryConn_?this.onSecondaryMessageReceived_(t):this.log_("message on old connection"))}}sendRequest(e){const t={t:"d",d:e};this.sendData_(t)}tryCleanupConnection(){this.tx_===this.secondaryConn_&&this.rx_===this.secondaryConn_&&(this.log_("cleaning up and promoting a connection: "+this.secondaryConn_.connId),this.conn_=this.secondaryConn_,this.secondaryConn_=null)}onSecondaryControl_(e){if(Di in e){const t=e[Di];t===Jr?this.upgradeIfSecondaryHealthy_():t===Yr?(this.log_("Got a reset on secondary, closing it"),this.secondaryConn_.close(),(this.tx_===this.secondaryConn_||this.rx_===this.secondaryConn_)&&this.close()):t===Qr&&(this.log_("got pong on secondary."),this.secondaryResponsesRequired_--,this.upgradeIfSecondaryHealthy_())}}onSecondaryMessageReceived_(e){const t=Pt("t",e),i=Pt("d",e);if(t==="c")this.onSecondaryControl_(i);else if(t==="d")this.pendingDataMessages.push(i);else throw new Error("Unknown protocol layer: "+t)}upgradeIfSecondaryHealthy_(){this.secondaryResponsesRequired_<=0?(this.log_("Secondary connection is healthy."),this.isHealthy_=!0,this.secondaryConn_.markConnectionHealthy(),this.proceedWithUpgrade_()):(this.log_("sending ping on secondary."),this.secondaryConn_.send({t:"c",d:{t:Zr,d:{}}}))}proceedWithUpgrade_(){this.secondaryConn_.start(),this.log_("sending client ack on secondary"),this.secondaryConn_.send({t:"c",d:{t:Jr,d:{}}}),this.log_("Ending transmission on primary"),this.conn_.send({t:"c",d:{t:Xr,d:{}}}),this.tx_=this.secondaryConn_,this.tryCleanupConnection()}onPrimaryMessageReceived_(e){const t=Pt("t",e),i=Pt("d",e);t==="c"?this.onControl_(i):t==="d"&&this.onDataMessage_(i)}onDataMessage_(e){this.onPrimaryResponse_(),this.onMessage_(e)}onPrimaryResponse_(){this.isHealthy_||(this.primaryResponsesRequired_--,this.primaryResponsesRequired_<=0&&(this.log_("Primary connection is healthy."),this.isHealthy_=!0,this.conn_.markConnectionHealthy()))}onControl_(e){const t=Pt(Di,e);if(Kr in e){const i=e[Kr];if(t===Fp){const s=Object.assign({},i);this.repoInfo_.isUsingEmulator&&(s.h=this.repoInfo_.host),this.onHandshake_(s)}else if(t===Xr){this.log_("recvd end transmission on primary"),this.rx_=this.secondaryConn_;for(let s=0;s<this.pendingDataMessages.length;++s)this.onDataMessage_(this.pendingDataMessages[s]);this.pendingDataMessages=[],this.tryCleanupConnection()}else t===Lp?this.onConnectionShutdown_(i):t===Yr?this.onReset_(i):t===Mp?Xi("Server Error: "+i):t===Qr?(this.log_("got pong on primary."),this.onPrimaryResponse_(),this.sendPingOnPrimaryIfNecessary_()):Xi("Unknown control packet command: "+t)}}onHandshake_(e){const t=e.ts,i=e.v,s=e.h;this.sessionId=e.s,this.repoInfo_.host=s,this.state_===0&&(this.conn_.start(),this.onConnectionEstablished_(this.conn_,t),Rs!==i&&G("Protocol version mismatch detected"),this.tryStartUpgrade_())}tryStartUpgrade_(){const e=this.transportManager_.upgradeTransport();e&&this.startUpgrade_(e)}startUpgrade_(e){this.secondaryConn_=new e(this.nextTransportId_(),this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,this.sessionId),this.secondaryResponsesRequired_=e.responsesRequiredToBeHealthy||0;const t=this.connReceiver_(this.secondaryConn_),i=this.disconnReceiver_(this.secondaryConn_);this.secondaryConn_.open(t,i),Wt(()=>{this.secondaryConn_&&(this.log_("Timed out trying to upgrade."),this.secondaryConn_.close())},Math.floor(Pp))}onReset_(e){this.log_("Reset packet received.  New host: "+e),this.repoInfo_.host=e,this.state_===1?this.close():(this.closeConnections_(),this.start_())}onConnectionEstablished_(e,t){this.log_("Realtime connection established."),this.conn_=e,this.state_=1,this.onReady_&&(this.onReady_(t,this.sessionId),this.onReady_=null),this.primaryResponsesRequired_===0?(this.log_("Primary connection is healthy."),this.isHealthy_=!0):Wt(()=>{this.sendPingOnPrimaryIfNecessary_()},Math.floor(Op))}sendPingOnPrimaryIfNecessary_(){!this.isHealthy_&&this.state_===1&&(this.log_("sending ping on primary."),this.sendData_({t:"c",d:{t:Zr,d:{}}}))}onSecondaryConnectionLost_(){const e=this.secondaryConn_;this.secondaryConn_=null,(this.tx_===e||this.rx_===e)&&this.close()}onConnectionLost_(e){this.conn_=null,!e&&this.state_===0?(this.log_("Realtime connection failed."),this.repoInfo_.isCacheableHost()&&(qe.remove("host:"+this.repoInfo_.host),this.repoInfo_.internalHost=this.repoInfo_.host)):this.state_===1&&this.log_("Realtime connection lost."),this.close()}onConnectionShutdown_(e){this.log_("Connection shutdown command received. Shutting down..."),this.onKill_&&(this.onKill_(e),this.onKill_=null),this.onDisconnect_=null,this.close()}sendData_(e){if(this.state_!==1)throw"Connection is not connected";this.tx_.send(e)}close(){this.state_!==2&&(this.log_("Closing realtime connection."),this.state_=2,this.closeConnections_(),this.onDisconnect_&&(this.onDisconnect_(),this.onDisconnect_=null))}closeConnections_(){this.log_("Shutting down all connections"),this.conn_&&(this.conn_.close(),this.conn_=null),this.secondaryConn_&&(this.secondaryConn_.close(),this.secondaryConn_=null),this.healthyTimeout_&&(clearTimeout(this.healthyTimeout_),this.healthyTimeout_=null)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rc{put(e,t,i,s){}merge(e,t,i,s){}refreshAuthToken(e){}refreshAppCheckToken(e){}onDisconnectPut(e,t,i){}onDisconnectMerge(e,t,i){}onDisconnectCancel(e,t){}reportStats(e){}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class oc{constructor(e){this.allowedEvents_=e,this.listeners_={},_(Array.isArray(e)&&e.length>0,"Requires a non-empty array")}trigger(e,...t){if(Array.isArray(this.listeners_[e])){const i=[...this.listeners_[e]];for(let s=0;s<i.length;s++)i[s].callback.apply(i[s].context,t)}}on(e,t,i){this.validateEventType_(e),this.listeners_[e]=this.listeners_[e]||[],this.listeners_[e].push({callback:t,context:i});const s=this.getInitialEvent(e);s&&t.apply(i,s)}off(e,t,i){this.validateEventType_(e);const s=this.listeners_[e]||[];for(let r=0;r<s.length;r++)if(s[r].callback===t&&(!i||i===s[r].context)){s.splice(r,1);return}}validateEventType_(e){_(this.allowedEvents_.find(t=>t===e),"Unknown event: "+e)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Gn extends oc{constructor(){super(["online"]),this.online_=!0,typeof window<"u"&&typeof window.addEventListener<"u"&&!ms()&&(window.addEventListener("online",()=>{this.online_||(this.online_=!0,this.trigger("online",!0))},!1),window.addEventListener("offline",()=>{this.online_&&(this.online_=!1,this.trigger("online",!1))},!1))}static getInstance(){return new Gn}getInitialEvent(e){return _(e==="online","Unknown event type: "+e),[this.online_]}currentlyOnline(){return this.online_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const eo=32,to=768;class k{constructor(e,t){if(t===void 0){this.pieces_=e.split("/");let i=0;for(let s=0;s<this.pieces_.length;s++)this.pieces_[s].length>0&&(this.pieces_[i]=this.pieces_[s],i++);this.pieces_.length=i,this.pieceNum_=0}else this.pieces_=e,this.pieceNum_=t}toString(){let e="";for(let t=this.pieceNum_;t<this.pieces_.length;t++)this.pieces_[t]!==""&&(e+="/"+this.pieces_[t]);return e||"/"}}function S(){return new k("")}function I(n){return n.pieceNum_>=n.pieces_.length?null:n.pieces_[n.pieceNum_]}function Me(n){return n.pieces_.length-n.pieceNum_}function A(n){let e=n.pieceNum_;return e<n.pieces_.length&&e++,new k(n.pieces_,e)}function ac(n){return n.pieceNum_<n.pieces_.length?n.pieces_[n.pieces_.length-1]:null}function $p(n){let e="";for(let t=n.pieceNum_;t<n.pieces_.length;t++)n.pieces_[t]!==""&&(e+="/"+encodeURIComponent(String(n.pieces_[t])));return e||"/"}function cc(n,e=0){return n.pieces_.slice(n.pieceNum_+e)}function lc(n){if(n.pieceNum_>=n.pieces_.length)return null;const e=[];for(let t=n.pieceNum_;t<n.pieces_.length-1;t++)e.push(n.pieces_[t]);return new k(e,0)}function F(n,e){const t=[];for(let i=n.pieceNum_;i<n.pieces_.length;i++)t.push(n.pieces_[i]);if(e instanceof k)for(let i=e.pieceNum_;i<e.pieces_.length;i++)t.push(e.pieces_[i]);else{const i=e.split("/");for(let s=0;s<i.length;s++)i[s].length>0&&t.push(i[s])}return new k(t,0)}function b(n){return n.pieceNum_>=n.pieces_.length}function j(n,e){const t=I(n),i=I(e);if(t===null)return e;if(t===i)return j(A(n),A(e));throw new Error("INTERNAL ERROR: innerPath ("+e+") is not within outerPath ("+n+")")}function Os(n,e){if(Me(n)!==Me(e))return!1;for(let t=n.pieceNum_,i=e.pieceNum_;t<=n.pieces_.length;t++,i++)if(n.pieces_[t]!==e.pieces_[i])return!1;return!0}function ee(n,e){let t=n.pieceNum_,i=e.pieceNum_;if(Me(n)>Me(e))return!1;for(;t<n.pieces_.length;){if(n.pieces_[t]!==e.pieces_[i])return!1;++t,++i}return!0}class Wp{constructor(e,t){this.errorPrefix_=t,this.parts_=cc(e,0),this.byteLength_=Math.max(1,this.parts_.length);for(let i=0;i<this.parts_.length;i++)this.byteLength_+=ci(this.parts_[i]);uc(this)}}function Bp(n,e){n.parts_.length>0&&(n.byteLength_+=1),n.parts_.push(e),n.byteLength_+=ci(e),uc(n)}function Hp(n){const e=n.parts_.pop();n.byteLength_-=ci(e),n.parts_.length>0&&(n.byteLength_-=1)}function uc(n){if(n.byteLength_>to)throw new Error(n.errorPrefix_+"has a key path longer than "+to+" bytes ("+n.byteLength_+").");if(n.parts_.length>eo)throw new Error(n.errorPrefix_+"path specified exceeds the maximum depth that can be written ("+eo+") or object contains a cycle "+Ve(n))}function Ve(n){return n.parts_.length===0?"":"in property '"+n.parts_.join(".")+"'"}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ds extends oc{constructor(){super(["visible"]);let e,t;typeof document<"u"&&typeof document.addEventListener<"u"&&(typeof document.hidden<"u"?(t="visibilitychange",e="hidden"):typeof document.mozHidden<"u"?(t="mozvisibilitychange",e="mozHidden"):typeof document.msHidden<"u"?(t="msvisibilitychange",e="msHidden"):typeof document.webkitHidden<"u"&&(t="webkitvisibilitychange",e="webkitHidden")),this.visible_=!0,t&&document.addEventListener(t,()=>{const i=!document[e];i!==this.visible_&&(this.visible_=i,this.trigger("visible",i))},!1)}static getInstance(){return new Ds}getInitialEvent(e){return _(e==="visible","Unknown event type: "+e),[this.visible_]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Ot=1e3,Vp=60*5*1e3,no=30*1e3,qp=1.3,jp=3e4,zp="server_kill",io=3;class _e extends rc{constructor(e,t,i,s,r,o,a,c){if(super(),this.repoInfo_=e,this.applicationId_=t,this.onDataUpdate_=i,this.onConnectStatus_=s,this.onServerInfoUpdate_=r,this.authTokenProvider_=o,this.appCheckTokenProvider_=a,this.authOverride_=c,this.id=_e.nextPersistentConnectionId_++,this.log_=ln("p:"+this.id+":"),this.interruptReasons_={},this.listens=new Map,this.outstandingPuts_=[],this.outstandingGets_=[],this.outstandingPutCount_=0,this.outstandingGetCount_=0,this.onDisconnectRequestQueue_=[],this.connected_=!1,this.reconnectDelay_=Ot,this.maxReconnectDelay_=Vp,this.securityDebugCallback_=null,this.lastSessionId=null,this.establishConnectionTimer_=null,this.visible_=!1,this.requestCBHash_={},this.requestNumber_=0,this.realtime_=null,this.authToken_=null,this.appCheckToken_=null,this.forceTokenRefresh_=!1,this.invalidAuthTokenCount_=0,this.invalidAppCheckTokenCount_=0,this.firstConnection_=!0,this.lastConnectionAttemptTime_=null,this.lastConnectionEstablishedTime_=null,c)throw new Error("Auth override specified in options, but not supported on non Node.js platforms");Ds.getInstance().on("visible",this.onVisible_,this),e.host.indexOf("fblocal")===-1&&Gn.getInstance().on("online",this.onOnline_,this)}sendRequest(e,t,i){const s=++this.requestNumber_,r={r:s,a:e,b:t};this.log_(W(r)),_(this.connected_,"sendRequest call when we're not connected not allowed."),this.realtime_.sendRequest(r),i&&(this.requestCBHash_[s]=i)}get(e){this.initConnection_();const t=new ai,s={action:"g",request:{p:e._path.toString(),q:e._queryObject},onComplete:o=>{const a=o.d;o.s==="ok"?t.resolve(a):t.reject(a)}};this.outstandingGets_.push(s),this.outstandingGetCount_++;const r=this.outstandingGets_.length-1;return this.connected_&&this.sendGet_(r),t.promise}listen(e,t,i,s){this.initConnection_();const r=e._queryIdentifier,o=e._path.toString();this.log_("Listen called for "+o+" "+r),this.listens.has(o)||this.listens.set(o,new Map),_(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"listen() called for non-default but complete query"),_(!this.listens.get(o).has(r),"listen() called twice for same path/queryId.");const a={onComplete:s,hashFn:t,query:e,tag:i};this.listens.get(o).set(r,a),this.connected_&&this.sendListen_(a)}sendGet_(e){const t=this.outstandingGets_[e];this.sendRequest("g",t.request,i=>{delete this.outstandingGets_[e],this.outstandingGetCount_--,this.outstandingGetCount_===0&&(this.outstandingGets_=[]),t.onComplete&&t.onComplete(i)})}sendListen_(e){const t=e.query,i=t._path.toString(),s=t._queryIdentifier;this.log_("Listen on "+i+" for "+s);const r={p:i},o="q";e.tag&&(r.q=t._queryObject,r.t=e.tag),r.h=e.hashFn(),this.sendRequest(o,r,a=>{const c=a.d,l=a.s;_e.warnOnListenWarnings_(c,t),(this.listens.get(i)&&this.listens.get(i).get(s))===e&&(this.log_("listen response",a),l!=="ok"&&this.removeListen_(i,s),e.onComplete&&e.onComplete(l,c))})}static warnOnListenWarnings_(e,t){if(e&&typeof e=="object"&&Ie(e,"w")){const i=mt(e,"w");if(Array.isArray(i)&&~i.indexOf("no_index")){const s='".indexOn": "'+t._queryParams.getIndex().toString()+'"',r=t._path.toString();G(`Using an unspecified index. Your data will be downloaded and filtered on the client. Consider adding ${s} at ${r} to your security rules for better performance.`)}}}refreshAuthToken(e){this.authToken_=e,this.log_("Auth token refreshed"),this.authToken_?this.tryAuth():this.connected_&&this.sendRequest("unauth",{},()=>{}),this.reduceReconnectDelayIfAdminCredential_(e)}reduceReconnectDelayIfAdminCredential_(e){(e&&e.length===40||Lu(e))&&(this.log_("Admin auth credential detected.  Reducing max reconnect time."),this.maxReconnectDelay_=no)}refreshAppCheckToken(e){this.appCheckToken_=e,this.log_("App check token refreshed"),this.appCheckToken_?this.tryAppCheck():this.connected_&&this.sendRequest("unappeck",{},()=>{})}tryAuth(){if(this.connected_&&this.authToken_){const e=this.authToken_,t=xu(e)?"auth":"gauth",i={cred:e};this.authOverride_===null?i.noauth=!0:typeof this.authOverride_=="object"&&(i.authvar=this.authOverride_),this.sendRequest(t,i,s=>{const r=s.s,o=s.d||"error";this.authToken_===e&&(r==="ok"?this.invalidAuthTokenCount_=0:this.onAuthRevoked_(r,o))})}}tryAppCheck(){this.connected_&&this.appCheckToken_&&this.sendRequest("appcheck",{token:this.appCheckToken_},e=>{const t=e.s,i=e.d||"error";t==="ok"?this.invalidAppCheckTokenCount_=0:this.onAppCheckRevoked_(t,i)})}unlisten(e,t){const i=e._path.toString(),s=e._queryIdentifier;this.log_("Unlisten called for "+i+" "+s),_(e._queryParams.isDefault()||!e._queryParams.loadsAllData(),"unlisten() called for non-default but complete query"),this.removeListen_(i,s)&&this.connected_&&this.sendUnlisten_(i,s,e._queryObject,t)}sendUnlisten_(e,t,i,s){this.log_("Unlisten on "+e+" for "+t);const r={p:e},o="n";s&&(r.q=i,r.t=s),this.sendRequest(o,r)}onDisconnectPut(e,t,i){this.initConnection_(),this.connected_?this.sendOnDisconnect_("o",e,t,i):this.onDisconnectRequestQueue_.push({pathString:e,action:"o",data:t,onComplete:i})}onDisconnectMerge(e,t,i){this.initConnection_(),this.connected_?this.sendOnDisconnect_("om",e,t,i):this.onDisconnectRequestQueue_.push({pathString:e,action:"om",data:t,onComplete:i})}onDisconnectCancel(e,t){this.initConnection_(),this.connected_?this.sendOnDisconnect_("oc",e,null,t):this.onDisconnectRequestQueue_.push({pathString:e,action:"oc",data:null,onComplete:t})}sendOnDisconnect_(e,t,i,s){const r={p:t,d:i};this.log_("onDisconnect "+e,r),this.sendRequest(e,r,o=>{s&&setTimeout(()=>{s(o.s,o.d)},Math.floor(0))})}put(e,t,i,s){this.putInternal("p",e,t,i,s)}merge(e,t,i,s){this.putInternal("m",e,t,i,s)}putInternal(e,t,i,s,r){this.initConnection_();const o={p:t,d:i};r!==void 0&&(o.h=r),this.outstandingPuts_.push({action:e,request:o,onComplete:s}),this.outstandingPutCount_++;const a=this.outstandingPuts_.length-1;this.connected_?this.sendPut_(a):this.log_("Buffering put: "+t)}sendPut_(e){const t=this.outstandingPuts_[e].action,i=this.outstandingPuts_[e].request,s=this.outstandingPuts_[e].onComplete;this.outstandingPuts_[e].queued=this.connected_,this.sendRequest(t,i,r=>{this.log_(t+" response",r),delete this.outstandingPuts_[e],this.outstandingPutCount_--,this.outstandingPutCount_===0&&(this.outstandingPuts_=[]),s&&s(r.s,r.d)})}reportStats(e){if(this.connected_){const t={c:e};this.log_("reportStats",t),this.sendRequest("s",t,i=>{if(i.s!=="ok"){const r=i.d;this.log_("reportStats","Error sending stats: "+r)}})}}onDataMessage_(e){if("r"in e){this.log_("from server: "+W(e));const t=e.r,i=this.requestCBHash_[t];i&&(delete this.requestCBHash_[t],i(e.b))}else{if("error"in e)throw"A server-side error has occurred: "+e.error;"a"in e&&this.onDataPush_(e.a,e.b)}}onDataPush_(e,t){this.log_("handleServerMessage",e,t),e==="d"?this.onDataUpdate_(t.p,t.d,!1,t.t):e==="m"?this.onDataUpdate_(t.p,t.d,!0,t.t):e==="c"?this.onListenRevoked_(t.p,t.q):e==="ac"?this.onAuthRevoked_(t.s,t.d):e==="apc"?this.onAppCheckRevoked_(t.s,t.d):e==="sd"?this.onSecurityDebugPacket_(t):Xi("Unrecognized action received from server: "+W(e)+`
Are you using the latest client?`)}onReady_(e,t){this.log_("connection ready"),this.connected_=!0,this.lastConnectionEstablishedTime_=new Date().getTime(),this.handleTimestamp_(e),this.lastSessionId=t,this.firstConnection_&&this.sendConnectStats_(),this.restoreState_(),this.firstConnection_=!1,this.onConnectStatus_(!0)}scheduleConnect_(e){_(!this.realtime_,"Scheduling a connect when we're already connected/ing?"),this.establishConnectionTimer_&&clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=setTimeout(()=>{this.establishConnectionTimer_=null,this.establishConnection_()},Math.floor(e))}initConnection_(){!this.realtime_&&this.firstConnection_&&this.scheduleConnect_(0)}onVisible_(e){e&&!this.visible_&&this.reconnectDelay_===this.maxReconnectDelay_&&(this.log_("Window became visible.  Reducing delay."),this.reconnectDelay_=Ot,this.realtime_||this.scheduleConnect_(0)),this.visible_=e}onOnline_(e){e?(this.log_("Browser went online."),this.reconnectDelay_=Ot,this.realtime_||this.scheduleConnect_(0)):(this.log_("Browser went offline.  Killing connection."),this.realtime_&&this.realtime_.close())}onRealtimeDisconnect_(){if(this.log_("data client disconnected"),this.connected_=!1,this.realtime_=null,this.cancelSentTransactions_(),this.requestCBHash_={},this.shouldReconnect_()){this.visible_?this.lastConnectionEstablishedTime_&&(new Date().getTime()-this.lastConnectionEstablishedTime_>jp&&(this.reconnectDelay_=Ot),this.lastConnectionEstablishedTime_=null):(this.log_("Window isn't visible.  Delaying reconnect."),this.reconnectDelay_=this.maxReconnectDelay_,this.lastConnectionAttemptTime_=new Date().getTime());const e=new Date().getTime()-this.lastConnectionAttemptTime_;let t=Math.max(0,this.reconnectDelay_-e);t=Math.random()*t,this.log_("Trying to reconnect in "+t+"ms"),this.scheduleConnect_(t),this.reconnectDelay_=Math.min(this.maxReconnectDelay_,this.reconnectDelay_*qp)}this.onConnectStatus_(!1)}async establishConnection_(){if(this.shouldReconnect_()){this.log_("Making a connection attempt"),this.lastConnectionAttemptTime_=new Date().getTime(),this.lastConnectionEstablishedTime_=null;const e=this.onDataMessage_.bind(this),t=this.onReady_.bind(this),i=this.onRealtimeDisconnect_.bind(this),s=this.id+":"+_e.nextConnectionId_++,r=this.lastSessionId;let o=!1,a=null;const c=function(){a?a.close():(o=!0,i())},l=function(u){_(a,"sendRequest call when we're not connected not allowed."),a.sendRequest(u)};this.realtime_={close:c,sendRequest:l};const h=this.forceTokenRefresh_;this.forceTokenRefresh_=!1;try{const[u,d]=await Promise.all([this.authTokenProvider_.getToken(h),this.appCheckTokenProvider_.getToken(h)]);o?H("getToken() completed but was canceled"):(H("getToken() completed. Creating connection."),this.authToken_=u&&u.accessToken,this.appCheckToken_=d&&d.token,a=new Up(s,this.repoInfo_,this.applicationId_,this.appCheckToken_,this.authToken_,e,t,i,f=>{G(f+" ("+this.repoInfo_.toString()+")"),this.interrupt(zp)},r))}catch(u){this.log_("Failed to get token: "+u),o||(this.repoInfo_.nodeAdmin&&G(u),c())}}}interrupt(e){H("Interrupting connection for reason: "+e),this.interruptReasons_[e]=!0,this.realtime_?this.realtime_.close():(this.establishConnectionTimer_&&(clearTimeout(this.establishConnectionTimer_),this.establishConnectionTimer_=null),this.connected_&&this.onRealtimeDisconnect_())}resume(e){H("Resuming connection for reason: "+e),delete this.interruptReasons_[e],Vi(this.interruptReasons_)&&(this.reconnectDelay_=Ot,this.realtime_||this.scheduleConnect_(0))}handleTimestamp_(e){const t=e-new Date().getTime();this.onServerInfoUpdate_({serverTimeOffset:t})}cancelSentTransactions_(){for(let e=0;e<this.outstandingPuts_.length;e++){const t=this.outstandingPuts_[e];t&&"h"in t.request&&t.queued&&(t.onComplete&&t.onComplete("disconnect"),delete this.outstandingPuts_[e],this.outstandingPutCount_--)}this.outstandingPutCount_===0&&(this.outstandingPuts_=[])}onListenRevoked_(e,t){let i;t?i=t.map(r=>As(r)).join("$"):i="default";const s=this.removeListen_(e,i);s&&s.onComplete&&s.onComplete("permission_denied")}removeListen_(e,t){const i=new k(e).toString();let s;if(this.listens.has(i)){const r=this.listens.get(i);s=r.get(t),r.delete(t),r.size===0&&this.listens.delete(i)}else s=void 0;return s}onAuthRevoked_(e,t){H("Auth token revoked: "+e+"/"+t),this.authToken_=null,this.forceTokenRefresh_=!0,this.realtime_.close(),(e==="invalid_token"||e==="permission_denied")&&(this.invalidAuthTokenCount_++,this.invalidAuthTokenCount_>=io&&(this.reconnectDelay_=no,this.authTokenProvider_.notifyForInvalidToken()))}onAppCheckRevoked_(e,t){H("App check token revoked: "+e+"/"+t),this.appCheckToken_=null,this.forceTokenRefresh_=!0,(e==="invalid_token"||e==="permission_denied")&&(this.invalidAppCheckTokenCount_++,this.invalidAppCheckTokenCount_>=io&&this.appCheckTokenProvider_.notifyForInvalidToken())}onSecurityDebugPacket_(e){this.securityDebugCallback_?this.securityDebugCallback_(e):"msg"in e&&console.log("FIREBASE: "+e.msg.replace(`
`,`
FIREBASE: `))}restoreState_(){this.tryAuth(),this.tryAppCheck();for(const e of this.listens.values())for(const t of e.values())this.sendListen_(t);for(let e=0;e<this.outstandingPuts_.length;e++)this.outstandingPuts_[e]&&this.sendPut_(e);for(;this.onDisconnectRequestQueue_.length;){const e=this.onDisconnectRequestQueue_.shift();this.sendOnDisconnect_(e.action,e.pathString,e.data,e.onComplete)}for(let e=0;e<this.outstandingGets_.length;e++)this.outstandingGets_[e]&&this.sendGet_(e)}sendConnectStats_(){const e={};let t="js";e["sdk."+t+"."+Fa.replace(/\./g,"-")]=1,ms()?e["framework.cordova"]=1:Qo()&&(e["framework.reactnative"]=1),this.reportStats(e)}shouldReconnect_(){const e=Gn.getInstance().currentlyOnline();return Vi(this.interruptReasons_)&&e}}_e.nextPersistentConnectionId_=0;_e.nextConnectionId_=0;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class C{constructor(e,t){this.name=e,this.node=t}static Wrap(e,t){return new C(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class fi{getCompare(){return this.compare.bind(this)}indexedValueChanged(e,t){const i=new C(gt,e),s=new C(gt,t);return this.compare(i,s)!==0}minPost(){return C.MIN}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let mn;class hc extends fi{static get __EMPTY_NODE(){return mn}static set __EMPTY_NODE(e){mn=e}compare(e,t){return St(e.name,t.name)}isDefinedOn(e){throw Et("KeyIndex.isDefinedOn not expected to be called.")}indexedValueChanged(e,t){return!1}minPost(){return C.MIN}maxPost(){return new C(Qe,mn)}makePost(e,t){return _(typeof e=="string","KeyIndex indexValue must always be a string."),new C(e,mn)}toString(){return".key"}}const ft=new hc;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class _n{constructor(e,t,i,s,r=null){this.isReverse_=s,this.resultGenerator_=r,this.nodeStack_=[];let o=1;for(;!e.isEmpty();)if(e=e,o=t?i(e.key,t):1,s&&(o*=-1),o<0)this.isReverse_?e=e.left:e=e.right;else if(o===0){this.nodeStack_.push(e);break}else this.nodeStack_.push(e),this.isReverse_?e=e.right:e=e.left}getNext(){if(this.nodeStack_.length===0)return null;let e=this.nodeStack_.pop(),t;if(this.resultGenerator_?t=this.resultGenerator_(e.key,e.value):t={key:e.key,value:e.value},this.isReverse_)for(e=e.left;!e.isEmpty();)this.nodeStack_.push(e),e=e.right;else for(e=e.right;!e.isEmpty();)this.nodeStack_.push(e),e=e.left;return t}hasNext(){return this.nodeStack_.length>0}peek(){if(this.nodeStack_.length===0)return null;const e=this.nodeStack_[this.nodeStack_.length-1];return this.resultGenerator_?this.resultGenerator_(e.key,e.value):{key:e.key,value:e.value}}}class ${constructor(e,t,i,s,r){this.key=e,this.value=t,this.color=i??$.RED,this.left=s??z.EMPTY_NODE,this.right=r??z.EMPTY_NODE}copy(e,t,i,s,r){return new $(e??this.key,t??this.value,i??this.color,s??this.left,r??this.right)}count(){return this.left.count()+1+this.right.count()}isEmpty(){return!1}inorderTraversal(e){return this.left.inorderTraversal(e)||!!e(this.key,this.value)||this.right.inorderTraversal(e)}reverseTraversal(e){return this.right.reverseTraversal(e)||e(this.key,this.value)||this.left.reverseTraversal(e)}min_(){return this.left.isEmpty()?this:this.left.min_()}minKey(){return this.min_().key}maxKey(){return this.right.isEmpty()?this.key:this.right.maxKey()}insert(e,t,i){let s=this;const r=i(e,s.key);return r<0?s=s.copy(null,null,null,s.left.insert(e,t,i),null):r===0?s=s.copy(null,t,null,null,null):s=s.copy(null,null,null,null,s.right.insert(e,t,i)),s.fixUp_()}removeMin_(){if(this.left.isEmpty())return z.EMPTY_NODE;let e=this;return!e.left.isRed_()&&!e.left.left.isRed_()&&(e=e.moveRedLeft_()),e=e.copy(null,null,null,e.left.removeMin_(),null),e.fixUp_()}remove(e,t){let i,s;if(i=this,t(e,i.key)<0)!i.left.isEmpty()&&!i.left.isRed_()&&!i.left.left.isRed_()&&(i=i.moveRedLeft_()),i=i.copy(null,null,null,i.left.remove(e,t),null);else{if(i.left.isRed_()&&(i=i.rotateRight_()),!i.right.isEmpty()&&!i.right.isRed_()&&!i.right.left.isRed_()&&(i=i.moveRedRight_()),t(e,i.key)===0){if(i.right.isEmpty())return z.EMPTY_NODE;s=i.right.min_(),i=i.copy(s.key,s.value,null,null,i.right.removeMin_())}i=i.copy(null,null,null,null,i.right.remove(e,t))}return i.fixUp_()}isRed_(){return this.color}fixUp_(){let e=this;return e.right.isRed_()&&!e.left.isRed_()&&(e=e.rotateLeft_()),e.left.isRed_()&&e.left.left.isRed_()&&(e=e.rotateRight_()),e.left.isRed_()&&e.right.isRed_()&&(e=e.colorFlip_()),e}moveRedLeft_(){let e=this.colorFlip_();return e.right.left.isRed_()&&(e=e.copy(null,null,null,null,e.right.rotateRight_()),e=e.rotateLeft_(),e=e.colorFlip_()),e}moveRedRight_(){let e=this.colorFlip_();return e.left.left.isRed_()&&(e=e.rotateRight_(),e=e.colorFlip_()),e}rotateLeft_(){const e=this.copy(null,null,$.RED,null,this.right.left);return this.right.copy(null,null,this.color,e,null)}rotateRight_(){const e=this.copy(null,null,$.RED,this.left.right,null);return this.left.copy(null,null,this.color,null,e)}colorFlip_(){const e=this.left.copy(null,null,!this.left.color,null,null),t=this.right.copy(null,null,!this.right.color,null,null);return this.copy(null,null,!this.color,e,t)}checkMaxDepth_(){const e=this.check_();return Math.pow(2,e)<=this.count()+1}check_(){if(this.isRed_()&&this.left.isRed_())throw new Error("Red node has red child("+this.key+","+this.value+")");if(this.right.isRed_())throw new Error("Right child of ("+this.key+","+this.value+") is red");const e=this.left.check_();if(e!==this.right.check_())throw new Error("Black depths differ");return e+(this.isRed_()?0:1)}}$.RED=!0;$.BLACK=!1;class Gp{copy(e,t,i,s,r){return this}insert(e,t,i){return new $(e,t,null)}remove(e,t){return this}count(){return 0}isEmpty(){return!0}inorderTraversal(e){return!1}reverseTraversal(e){return!1}minKey(){return null}maxKey(){return null}check_(){return 0}isRed_(){return!1}}class z{constructor(e,t=z.EMPTY_NODE){this.comparator_=e,this.root_=t}insert(e,t){return new z(this.comparator_,this.root_.insert(e,t,this.comparator_).copy(null,null,$.BLACK,null,null))}remove(e){return new z(this.comparator_,this.root_.remove(e,this.comparator_).copy(null,null,$.BLACK,null,null))}get(e){let t,i=this.root_;for(;!i.isEmpty();){if(t=this.comparator_(e,i.key),t===0)return i.value;t<0?i=i.left:t>0&&(i=i.right)}return null}getPredecessorKey(e){let t,i=this.root_,s=null;for(;!i.isEmpty();)if(t=this.comparator_(e,i.key),t===0){if(i.left.isEmpty())return s?s.key:null;for(i=i.left;!i.right.isEmpty();)i=i.right;return i.key}else t<0?i=i.left:t>0&&(s=i,i=i.right);throw new Error("Attempted to find predecessor key for a nonexistent key.  What gives?")}isEmpty(){return this.root_.isEmpty()}count(){return this.root_.count()}minKey(){return this.root_.minKey()}maxKey(){return this.root_.maxKey()}inorderTraversal(e){return this.root_.inorderTraversal(e)}reverseTraversal(e){return this.root_.reverseTraversal(e)}getIterator(e){return new _n(this.root_,null,this.comparator_,!1,e)}getIteratorFrom(e,t){return new _n(this.root_,e,this.comparator_,!1,t)}getReverseIteratorFrom(e,t){return new _n(this.root_,e,this.comparator_,!0,t)}getReverseIterator(e){return new _n(this.root_,null,this.comparator_,!0,e)}}z.EMPTY_NODE=new Gp;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Kp(n,e){return St(n.name,e.name)}function xs(n,e){return St(n,e)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let es;function Yp(n){es=n}const dc=function(n){return typeof n=="number"?"number:"+Ha(n):"string:"+n},fc=function(n){if(n.isLeafNode()){const e=n.val();_(typeof e=="string"||typeof e=="number"||typeof e=="object"&&Ie(e,".sv"),"Priority must be a string or number.")}else _(n===es||n.isEmpty(),"priority of unexpected type.");_(n===es||n.getPriority().isEmpty(),"Priority nodes can't have a priority of their own.")};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let so;class U{constructor(e,t=U.__childrenNodeConstructor.EMPTY_NODE){this.value_=e,this.priorityNode_=t,this.lazyHash_=null,_(this.value_!==void 0&&this.value_!==null,"LeafNode shouldn't be created with null/undefined value."),fc(this.priorityNode_)}static set __childrenNodeConstructor(e){so=e}static get __childrenNodeConstructor(){return so}isLeafNode(){return!0}getPriority(){return this.priorityNode_}updatePriority(e){return new U(this.value_,e)}getImmediateChild(e){return e===".priority"?this.priorityNode_:U.__childrenNodeConstructor.EMPTY_NODE}getChild(e){return b(e)?this:I(e)===".priority"?this.priorityNode_:U.__childrenNodeConstructor.EMPTY_NODE}hasChild(){return!1}getPredecessorChildName(e,t){return null}updateImmediateChild(e,t){return e===".priority"?this.updatePriority(t):t.isEmpty()&&e!==".priority"?this:U.__childrenNodeConstructor.EMPTY_NODE.updateImmediateChild(e,t).updatePriority(this.priorityNode_)}updateChild(e,t){const i=I(e);return i===null?t:t.isEmpty()&&i!==".priority"?this:(_(i!==".priority"||Me(e)===1,".priority must be the last token in a path"),this.updateImmediateChild(i,U.__childrenNodeConstructor.EMPTY_NODE.updateChild(A(e),t)))}isEmpty(){return!1}numChildren(){return 0}forEachChild(e,t){return!1}val(e){return e&&!this.getPriority().isEmpty()?{".value":this.getValue(),".priority":this.getPriority().val()}:this.getValue()}hash(){if(this.lazyHash_===null){let e="";this.priorityNode_.isEmpty()||(e+="priority:"+dc(this.priorityNode_.val())+":");const t=typeof this.value_;e+=t+":",t==="number"?e+=Ha(this.value_):e+=this.value_,this.lazyHash_=$a(e)}return this.lazyHash_}getValue(){return this.value_}compareTo(e){return e===U.__childrenNodeConstructor.EMPTY_NODE?1:e instanceof U.__childrenNodeConstructor?-1:(_(e.isLeafNode(),"Unknown node type"),this.compareToLeafNode_(e))}compareToLeafNode_(e){const t=typeof e.value_,i=typeof this.value_,s=U.VALUE_TYPE_ORDER.indexOf(t),r=U.VALUE_TYPE_ORDER.indexOf(i);return _(s>=0,"Unknown leaf type: "+t),_(r>=0,"Unknown leaf type: "+i),s===r?i==="object"?0:this.value_<e.value_?-1:this.value_===e.value_?0:1:r-s}withIndex(){return this}isIndexed(){return!0}equals(e){if(e===this)return!0;if(e.isLeafNode()){const t=e;return this.value_===t.value_&&this.priorityNode_.equals(t.priorityNode_)}else return!1}}U.VALUE_TYPE_ORDER=["object","boolean","number","string"];/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let pc,mc;function Qp(n){pc=n}function Jp(n){mc=n}class Xp extends fi{compare(e,t){const i=e.node.getPriority(),s=t.node.getPriority(),r=i.compareTo(s);return r===0?St(e.name,t.name):r}isDefinedOn(e){return!e.getPriority().isEmpty()}indexedValueChanged(e,t){return!e.getPriority().equals(t.getPriority())}minPost(){return C.MIN}maxPost(){return new C(Qe,new U("[PRIORITY-POST]",mc))}makePost(e,t){const i=pc(e);return new C(t,new U("[PRIORITY-POST]",i))}toString(){return".priority"}}const x=new Xp;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Zp=Math.log(2);class em{constructor(e){const t=r=>parseInt(Math.log(r)/Zp,10),i=r=>parseInt(Array(r+1).join("1"),2);this.count=t(e+1),this.current_=this.count-1;const s=i(this.count);this.bits_=e+1&s}nextBitIsOne(){const e=!(this.bits_&1<<this.current_);return this.current_--,e}}const Kn=function(n,e,t,i){n.sort(e);const s=function(c,l){const h=l-c;let u,d;if(h===0)return null;if(h===1)return u=n[c],d=t?t(u):u,new $(d,u.node,$.BLACK,null,null);{const f=parseInt(h/2,10)+c,m=s(c,f),v=s(f+1,l);return u=n[f],d=t?t(u):u,new $(d,u.node,$.BLACK,m,v)}},r=function(c){let l=null,h=null,u=n.length;const d=function(m,v){const E=u-m,N=u;u-=m;const P=s(E+1,N),O=n[E],L=t?t(O):O;f(new $(L,O.node,v,null,P))},f=function(m){l?(l.left=m,l=m):(h=m,l=m)};for(let m=0;m<c.count;++m){const v=c.nextBitIsOne(),E=Math.pow(2,c.count-(m+1));v?d(E,$.BLACK):(d(E,$.BLACK),d(E,$.RED))}return h},o=new em(n.length),a=r(o);return new z(i||e,a)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let xi;const it={};class pe{constructor(e,t){this.indexes_=e,this.indexSet_=t}static get Default(){return _(it&&x,"ChildrenNode.ts has not been loaded"),xi=xi||new pe({".priority":it},{".priority":x}),xi}get(e){const t=mt(this.indexes_,e);if(!t)throw new Error("No index defined for "+e);return t instanceof z?t:null}hasIndex(e){return Ie(this.indexSet_,e.toString())}addIndex(e,t){_(e!==ft,"KeyIndex always exists and isn't meant to be added to the IndexMap.");const i=[];let s=!1;const r=t.getIterator(C.Wrap);let o=r.getNext();for(;o;)s=s||e.isDefinedOn(o.node),i.push(o),o=r.getNext();let a;s?a=Kn(i,e.getCompare()):a=it;const c=e.toString(),l=Object.assign({},this.indexSet_);l[c]=e;const h=Object.assign({},this.indexes_);return h[c]=a,new pe(h,l)}addToIndexes(e,t){const i=Un(this.indexes_,(s,r)=>{const o=mt(this.indexSet_,r);if(_(o,"Missing index implementation for "+r),s===it)if(o.isDefinedOn(e.node)){const a=[],c=t.getIterator(C.Wrap);let l=c.getNext();for(;l;)l.name!==e.name&&a.push(l),l=c.getNext();return a.push(e),Kn(a,o.getCompare())}else return it;else{const a=t.get(e.name);let c=s;return a&&(c=c.remove(new C(e.name,a))),c.insert(e,e.node)}});return new pe(i,this.indexSet_)}removeFromIndexes(e,t){const i=Un(this.indexes_,s=>{if(s===it)return s;{const r=t.get(e.name);return r?s.remove(new C(e.name,r)):s}});return new pe(i,this.indexSet_)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Dt;class y{constructor(e,t,i){this.children_=e,this.priorityNode_=t,this.indexMap_=i,this.lazyHash_=null,this.priorityNode_&&fc(this.priorityNode_),this.children_.isEmpty()&&_(!this.priorityNode_||this.priorityNode_.isEmpty(),"An empty node cannot have a priority")}static get EMPTY_NODE(){return Dt||(Dt=new y(new z(xs),null,pe.Default))}isLeafNode(){return!1}getPriority(){return this.priorityNode_||Dt}updatePriority(e){return this.children_.isEmpty()?this:new y(this.children_,e,this.indexMap_)}getImmediateChild(e){if(e===".priority")return this.getPriority();{const t=this.children_.get(e);return t===null?Dt:t}}getChild(e){const t=I(e);return t===null?this:this.getImmediateChild(t).getChild(A(e))}hasChild(e){return this.children_.get(e)!==null}updateImmediateChild(e,t){if(_(t,"We should always be passing snapshot nodes"),e===".priority")return this.updatePriority(t);{const i=new C(e,t);let s,r;t.isEmpty()?(s=this.children_.remove(e),r=this.indexMap_.removeFromIndexes(i,this.children_)):(s=this.children_.insert(e,t),r=this.indexMap_.addToIndexes(i,this.children_));const o=s.isEmpty()?Dt:this.priorityNode_;return new y(s,o,r)}}updateChild(e,t){const i=I(e);if(i===null)return t;{_(I(e)!==".priority"||Me(e)===1,".priority must be the last token in a path");const s=this.getImmediateChild(i).updateChild(A(e),t);return this.updateImmediateChild(i,s)}}isEmpty(){return this.children_.isEmpty()}numChildren(){return this.children_.count()}val(e){if(this.isEmpty())return null;const t={};let i=0,s=0,r=!0;if(this.forEachChild(x,(o,a)=>{t[o]=a.val(e),i++,r&&y.INTEGER_REGEXP_.test(o)?s=Math.max(s,Number(o)):r=!1}),!e&&r&&s<2*i){const o=[];for(const a in t)o[a]=t[a];return o}else return e&&!this.getPriority().isEmpty()&&(t[".priority"]=this.getPriority().val()),t}hash(){if(this.lazyHash_===null){let e="";this.getPriority().isEmpty()||(e+="priority:"+dc(this.getPriority().val())+":"),this.forEachChild(x,(t,i)=>{const s=i.hash();s!==""&&(e+=":"+t+":"+s)}),this.lazyHash_=e===""?"":$a(e)}return this.lazyHash_}getPredecessorChildName(e,t,i){const s=this.resolveIndex_(i);if(s){const r=s.getPredecessorKey(new C(e,t));return r?r.name:null}else return this.children_.getPredecessorKey(e)}getFirstChildName(e){const t=this.resolveIndex_(e);if(t){const i=t.minKey();return i&&i.name}else return this.children_.minKey()}getFirstChild(e){const t=this.getFirstChildName(e);return t?new C(t,this.children_.get(t)):null}getLastChildName(e){const t=this.resolveIndex_(e);if(t){const i=t.maxKey();return i&&i.name}else return this.children_.maxKey()}getLastChild(e){const t=this.getLastChildName(e);return t?new C(t,this.children_.get(t)):null}forEachChild(e,t){const i=this.resolveIndex_(e);return i?i.inorderTraversal(s=>t(s.name,s.node)):this.children_.inorderTraversal(t)}getIterator(e){return this.getIteratorFrom(e.minPost(),e)}getIteratorFrom(e,t){const i=this.resolveIndex_(t);if(i)return i.getIteratorFrom(e,s=>s);{const s=this.children_.getIteratorFrom(e.name,C.Wrap);let r=s.peek();for(;r!=null&&t.compare(r,e)<0;)s.getNext(),r=s.peek();return s}}getReverseIterator(e){return this.getReverseIteratorFrom(e.maxPost(),e)}getReverseIteratorFrom(e,t){const i=this.resolveIndex_(t);if(i)return i.getReverseIteratorFrom(e,s=>s);{const s=this.children_.getReverseIteratorFrom(e.name,C.Wrap);let r=s.peek();for(;r!=null&&t.compare(r,e)>0;)s.getNext(),r=s.peek();return s}}compareTo(e){return this.isEmpty()?e.isEmpty()?0:-1:e.isLeafNode()||e.isEmpty()?1:e===un?-1:0}withIndex(e){if(e===ft||this.indexMap_.hasIndex(e))return this;{const t=this.indexMap_.addIndex(e,this.children_);return new y(this.children_,this.priorityNode_,t)}}isIndexed(e){return e===ft||this.indexMap_.hasIndex(e)}equals(e){if(e===this)return!0;if(e.isLeafNode())return!1;{const t=e;if(this.getPriority().equals(t.getPriority()))if(this.children_.count()===t.children_.count()){const i=this.getIterator(x),s=t.getIterator(x);let r=i.getNext(),o=s.getNext();for(;r&&o;){if(r.name!==o.name||!r.node.equals(o.node))return!1;r=i.getNext(),o=s.getNext()}return r===null&&o===null}else return!1;else return!1}}resolveIndex_(e){return e===ft?null:this.indexMap_.get(e.toString())}}y.INTEGER_REGEXP_=/^(0|[1-9]\d*)$/;class tm extends y{constructor(){super(new z(xs),y.EMPTY_NODE,pe.Default)}compareTo(e){return e===this?0:1}equals(e){return e===this}getPriority(){return this}getImmediateChild(e){return y.EMPTY_NODE}isEmpty(){return!1}}const un=new tm;Object.defineProperties(C,{MIN:{value:new C(gt,y.EMPTY_NODE)},MAX:{value:new C(Qe,un)}});hc.__EMPTY_NODE=y.EMPTY_NODE;U.__childrenNodeConstructor=y;Yp(un);Jp(un);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const nm=!0;function B(n,e=null){if(n===null)return y.EMPTY_NODE;if(typeof n=="object"&&".priority"in n&&(e=n[".priority"]),_(e===null||typeof e=="string"||typeof e=="number"||typeof e=="object"&&".sv"in e,"Invalid priority type found: "+typeof e),typeof n=="object"&&".value"in n&&n[".value"]!==null&&(n=n[".value"]),typeof n!="object"||".sv"in n){const t=n;return new U(t,B(e))}if(!(n instanceof Array)&&nm){const t=[];let i=!1;if(K(n,(o,a)=>{if(o.substring(0,1)!=="."){const c=B(a);c.isEmpty()||(i=i||!c.getPriority().isEmpty(),t.push(new C(o,c)))}}),t.length===0)return y.EMPTY_NODE;const r=Kn(t,Kp,o=>o.name,xs);if(i){const o=Kn(t,x.getCompare());return new y(r,B(e),new pe({".priority":o},{".priority":x}))}else return new y(r,B(e),pe.Default)}else{let t=y.EMPTY_NODE;return K(n,(i,s)=>{if(Ie(n,i)&&i.substring(0,1)!=="."){const r=B(s);(r.isLeafNode()||!r.isEmpty())&&(t=t.updateImmediateChild(i,r))}}),t.updatePriority(B(e))}}Qp(B);/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class im extends fi{constructor(e){super(),this.indexPath_=e,_(!b(e)&&I(e)!==".priority","Can't create PathIndex with empty path or .priority key")}extractChild(e){return e.getChild(this.indexPath_)}isDefinedOn(e){return!e.getChild(this.indexPath_).isEmpty()}compare(e,t){const i=this.extractChild(e.node),s=this.extractChild(t.node),r=i.compareTo(s);return r===0?St(e.name,t.name):r}makePost(e,t){const i=B(e),s=y.EMPTY_NODE.updateChild(this.indexPath_,i);return new C(t,s)}maxPost(){const e=y.EMPTY_NODE.updateChild(this.indexPath_,un);return new C(Qe,e)}toString(){return cc(this.indexPath_,0).join("/")}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class sm extends fi{compare(e,t){const i=e.node.compareTo(t.node);return i===0?St(e.name,t.name):i}isDefinedOn(e){return!0}indexedValueChanged(e,t){return!e.equals(t)}minPost(){return C.MIN}maxPost(){return C.MAX}makePost(e,t){const i=B(e);return new C(t,i)}toString(){return".value"}}const rm=new sm;/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function _c(n){return{type:"value",snapshotNode:n}}function vt(n,e){return{type:"child_added",snapshotNode:e,childName:n}}function Jt(n,e){return{type:"child_removed",snapshotNode:e,childName:n}}function Xt(n,e,t){return{type:"child_changed",snapshotNode:e,childName:n,oldSnap:t}}function om(n,e){return{type:"child_moved",snapshotNode:e,childName:n}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ls{constructor(e){this.index_=e}updateChild(e,t,i,s,r,o){_(e.isIndexed(this.index_),"A node must be indexed if only a child is updated");const a=e.getImmediateChild(t);return a.getChild(s).equals(i.getChild(s))&&a.isEmpty()===i.isEmpty()||(o!=null&&(i.isEmpty()?e.hasChild(t)?o.trackChildChange(Jt(t,a)):_(e.isLeafNode(),"A child remove without an old child only makes sense on a leaf node"):a.isEmpty()?o.trackChildChange(vt(t,i)):o.trackChildChange(Xt(t,i,a))),e.isLeafNode()&&i.isEmpty())?e:e.updateImmediateChild(t,i).withIndex(this.index_)}updateFullNode(e,t,i){return i!=null&&(e.isLeafNode()||e.forEachChild(x,(s,r)=>{t.hasChild(s)||i.trackChildChange(Jt(s,r))}),t.isLeafNode()||t.forEachChild(x,(s,r)=>{if(e.hasChild(s)){const o=e.getImmediateChild(s);o.equals(r)||i.trackChildChange(Xt(s,r,o))}else i.trackChildChange(vt(s,r))})),t.withIndex(this.index_)}updatePriority(e,t){return e.isEmpty()?y.EMPTY_NODE:e.updatePriority(t)}filtersNodes(){return!1}getIndexedFilter(){return this}getIndex(){return this.index_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Zt{constructor(e){this.indexedFilter_=new Ls(e.getIndex()),this.index_=e.getIndex(),this.startPost_=Zt.getStartPost_(e),this.endPost_=Zt.getEndPost_(e),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}getStartPost(){return this.startPost_}getEndPost(){return this.endPost_}matches(e){const t=this.startIsInclusive_?this.index_.compare(this.getStartPost(),e)<=0:this.index_.compare(this.getStartPost(),e)<0,i=this.endIsInclusive_?this.index_.compare(e,this.getEndPost())<=0:this.index_.compare(e,this.getEndPost())<0;return t&&i}updateChild(e,t,i,s,r,o){return this.matches(new C(t,i))||(i=y.EMPTY_NODE),this.indexedFilter_.updateChild(e,t,i,s,r,o)}updateFullNode(e,t,i){t.isLeafNode()&&(t=y.EMPTY_NODE);let s=t.withIndex(this.index_);s=s.updatePriority(y.EMPTY_NODE);const r=this;return t.forEachChild(x,(o,a)=>{r.matches(new C(o,a))||(s=s.updateImmediateChild(o,y.EMPTY_NODE))}),this.indexedFilter_.updateFullNode(e,s,i)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.indexedFilter_}getIndex(){return this.index_}static getStartPost_(e){if(e.hasStart()){const t=e.getIndexStartName();return e.getIndex().makePost(e.getIndexStartValue(),t)}else return e.getIndex().minPost()}static getEndPost_(e){if(e.hasEnd()){const t=e.getIndexEndName();return e.getIndex().makePost(e.getIndexEndValue(),t)}else return e.getIndex().maxPost()}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class am{constructor(e){this.withinDirectionalStart=t=>this.reverse_?this.withinEndPost(t):this.withinStartPost(t),this.withinDirectionalEnd=t=>this.reverse_?this.withinStartPost(t):this.withinEndPost(t),this.withinStartPost=t=>{const i=this.index_.compare(this.rangedFilter_.getStartPost(),t);return this.startIsInclusive_?i<=0:i<0},this.withinEndPost=t=>{const i=this.index_.compare(t,this.rangedFilter_.getEndPost());return this.endIsInclusive_?i<=0:i<0},this.rangedFilter_=new Zt(e),this.index_=e.getIndex(),this.limit_=e.getLimit(),this.reverse_=!e.isViewFromLeft(),this.startIsInclusive_=!e.startAfterSet_,this.endIsInclusive_=!e.endBeforeSet_}updateChild(e,t,i,s,r,o){return this.rangedFilter_.matches(new C(t,i))||(i=y.EMPTY_NODE),e.getImmediateChild(t).equals(i)?e:e.numChildren()<this.limit_?this.rangedFilter_.getIndexedFilter().updateChild(e,t,i,s,r,o):this.fullLimitUpdateChild_(e,t,i,r,o)}updateFullNode(e,t,i){let s;if(t.isLeafNode()||t.isEmpty())s=y.EMPTY_NODE.withIndex(this.index_);else if(this.limit_*2<t.numChildren()&&t.isIndexed(this.index_)){s=y.EMPTY_NODE.withIndex(this.index_);let r;this.reverse_?r=t.getReverseIteratorFrom(this.rangedFilter_.getEndPost(),this.index_):r=t.getIteratorFrom(this.rangedFilter_.getStartPost(),this.index_);let o=0;for(;r.hasNext()&&o<this.limit_;){const a=r.getNext();if(this.withinDirectionalStart(a))if(this.withinDirectionalEnd(a))s=s.updateImmediateChild(a.name,a.node),o++;else break;else continue}}else{s=t.withIndex(this.index_),s=s.updatePriority(y.EMPTY_NODE);let r;this.reverse_?r=s.getReverseIterator(this.index_):r=s.getIterator(this.index_);let o=0;for(;r.hasNext();){const a=r.getNext();o<this.limit_&&this.withinDirectionalStart(a)&&this.withinDirectionalEnd(a)?o++:s=s.updateImmediateChild(a.name,y.EMPTY_NODE)}}return this.rangedFilter_.getIndexedFilter().updateFullNode(e,s,i)}updatePriority(e,t){return e}filtersNodes(){return!0}getIndexedFilter(){return this.rangedFilter_.getIndexedFilter()}getIndex(){return this.index_}fullLimitUpdateChild_(e,t,i,s,r){let o;if(this.reverse_){const u=this.index_.getCompare();o=(d,f)=>u(f,d)}else o=this.index_.getCompare();const a=e;_(a.numChildren()===this.limit_,"");const c=new C(t,i),l=this.reverse_?a.getFirstChild(this.index_):a.getLastChild(this.index_),h=this.rangedFilter_.matches(c);if(a.hasChild(t)){const u=a.getImmediateChild(t);let d=s.getChildAfterChild(this.index_,l,this.reverse_);for(;d!=null&&(d.name===t||a.hasChild(d.name));)d=s.getChildAfterChild(this.index_,d,this.reverse_);const f=d==null?1:o(d,c);if(h&&!i.isEmpty()&&f>=0)return r!=null&&r.trackChildChange(Xt(t,i,u)),a.updateImmediateChild(t,i);{r!=null&&r.trackChildChange(Jt(t,u));const v=a.updateImmediateChild(t,y.EMPTY_NODE);return d!=null&&this.rangedFilter_.matches(d)?(r!=null&&r.trackChildChange(vt(d.name,d.node)),v.updateImmediateChild(d.name,d.node)):v}}else return i.isEmpty()?e:h&&o(l,c)>=0?(r!=null&&(r.trackChildChange(Jt(l.name,l.node)),r.trackChildChange(vt(t,i))),a.updateImmediateChild(t,i).updateImmediateChild(l.name,y.EMPTY_NODE)):e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ms{constructor(){this.limitSet_=!1,this.startSet_=!1,this.startNameSet_=!1,this.startAfterSet_=!1,this.endSet_=!1,this.endNameSet_=!1,this.endBeforeSet_=!1,this.limit_=0,this.viewFrom_="",this.indexStartValue_=null,this.indexStartName_="",this.indexEndValue_=null,this.indexEndName_="",this.index_=x}hasStart(){return this.startSet_}isViewFromLeft(){return this.viewFrom_===""?this.startSet_:this.viewFrom_==="l"}getIndexStartValue(){return _(this.startSet_,"Only valid if start has been set"),this.indexStartValue_}getIndexStartName(){return _(this.startSet_,"Only valid if start has been set"),this.startNameSet_?this.indexStartName_:gt}hasEnd(){return this.endSet_}getIndexEndValue(){return _(this.endSet_,"Only valid if end has been set"),this.indexEndValue_}getIndexEndName(){return _(this.endSet_,"Only valid if end has been set"),this.endNameSet_?this.indexEndName_:Qe}hasLimit(){return this.limitSet_}hasAnchoredLimit(){return this.limitSet_&&this.viewFrom_!==""}getLimit(){return _(this.limitSet_,"Only valid if limit has been set"),this.limit_}getIndex(){return this.index_}loadsAllData(){return!(this.startSet_||this.endSet_||this.limitSet_)}isDefault(){return this.loadsAllData()&&this.index_===x}copy(){const e=new Ms;return e.limitSet_=this.limitSet_,e.limit_=this.limit_,e.startSet_=this.startSet_,e.startAfterSet_=this.startAfterSet_,e.indexStartValue_=this.indexStartValue_,e.startNameSet_=this.startNameSet_,e.indexStartName_=this.indexStartName_,e.endSet_=this.endSet_,e.endBeforeSet_=this.endBeforeSet_,e.indexEndValue_=this.indexEndValue_,e.endNameSet_=this.endNameSet_,e.indexEndName_=this.indexEndName_,e.index_=this.index_,e.viewFrom_=this.viewFrom_,e}}function cm(n){return n.loadsAllData()?new Ls(n.getIndex()):n.hasLimit()?new am(n):new Zt(n)}function ro(n){const e={};if(n.isDefault())return e;let t;if(n.index_===x?t="$priority":n.index_===rm?t="$value":n.index_===ft?t="$key":(_(n.index_ instanceof im,"Unrecognized index type!"),t=n.index_.toString()),e.orderBy=W(t),n.startSet_){const i=n.startAfterSet_?"startAfter":"startAt";e[i]=W(n.indexStartValue_),n.startNameSet_&&(e[i]+=","+W(n.indexStartName_))}if(n.endSet_){const i=n.endBeforeSet_?"endBefore":"endAt";e[i]=W(n.indexEndValue_),n.endNameSet_&&(e[i]+=","+W(n.indexEndName_))}return n.limitSet_&&(n.isViewFromLeft()?e.limitToFirst=n.limit_:e.limitToLast=n.limit_),e}function oo(n){const e={};if(n.startSet_&&(e.sp=n.indexStartValue_,n.startNameSet_&&(e.sn=n.indexStartName_),e.sin=!n.startAfterSet_),n.endSet_&&(e.ep=n.indexEndValue_,n.endNameSet_&&(e.en=n.indexEndName_),e.ein=!n.endBeforeSet_),n.limitSet_){e.l=n.limit_;let t=n.viewFrom_;t===""&&(n.isViewFromLeft()?t="l":t="r"),e.vf=t}return n.index_!==x&&(e.i=n.index_.toString()),e}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Yn extends rc{constructor(e,t,i,s){super(),this.repoInfo_=e,this.onDataUpdate_=t,this.authTokenProvider_=i,this.appCheckTokenProvider_=s,this.log_=ln("p:rest:"),this.listens_={}}reportStats(e){throw new Error("Method not implemented.")}static getListenId_(e,t){return t!==void 0?"tag$"+t:(_(e._queryParams.isDefault(),"should have a tag if it's not a default query."),e._path.toString())}listen(e,t,i,s){const r=e._path.toString();this.log_("Listen called for "+r+" "+e._queryIdentifier);const o=Yn.getListenId_(e,i),a={};this.listens_[o]=a;const c=ro(e._queryParams);this.restRequest_(r+".json",c,(l,h)=>{let u=h;if(l===404&&(u=null,l=null),l===null&&this.onDataUpdate_(r,u,!1,i),mt(this.listens_,o)===a){let d;l?l===401?d="permission_denied":d="rest_error:"+l:d="ok",s(d,null)}})}unlisten(e,t){const i=Yn.getListenId_(e,t);delete this.listens_[i]}get(e){const t=ro(e._queryParams),i=e._path.toString(),s=new ai;return this.restRequest_(i+".json",t,(r,o)=>{let a=o;r===404&&(a=null,r=null),r===null?(this.onDataUpdate_(i,a,!1,null),s.resolve(a)):s.reject(new Error(a))}),s.promise}refreshAuthToken(e){}restRequest_(e,t={},i){return t.format="export",Promise.all([this.authTokenProvider_.getToken(!1),this.appCheckTokenProvider_.getToken(!1)]).then(([s,r])=>{s&&s.accessToken&&(t.auth=s.accessToken),r&&r.token&&(t.ac=r.token);const o=(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host+e+"?ns="+this.repoInfo_.namespace+It(t);this.log_("Sending REST request for "+o);const a=new XMLHttpRequest;a.onreadystatechange=()=>{if(i&&a.readyState===4){this.log_("REST Response for "+o+" received. status:",a.status,"response:",a.responseText);let c=null;if(a.status>=200&&a.status<300){try{c=Gt(a.responseText)}catch{G("Failed to parse JSON response for "+o+": "+a.responseText)}i(null,c)}else a.status!==401&&a.status!==404&&G("Got unsuccessful REST response for "+o+" Status: "+a.status),i(a.status);i=null}},a.open("GET",o,!0),a.send()})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class lm{constructor(){this.rootNode_=y.EMPTY_NODE}getNode(e){return this.rootNode_.getChild(e)}updateSnapshot(e,t){this.rootNode_=this.rootNode_.updateChild(e,t)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Qn(){return{value:null,children:new Map}}function gc(n,e,t){if(b(e))n.value=t,n.children.clear();else if(n.value!==null)n.value=n.value.updateChild(e,t);else{const i=I(e);n.children.has(i)||n.children.set(i,Qn());const s=n.children.get(i);e=A(e),gc(s,e,t)}}function ts(n,e,t){n.value!==null?t(e,n.value):um(n,(i,s)=>{const r=new k(e.toString()+"/"+i);ts(s,r,t)})}function um(n,e){n.children.forEach((t,i)=>{e(i,t)})}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class hm{constructor(e){this.collection_=e,this.last_=null}get(){const e=this.collection_.get(),t=Object.assign({},e);return this.last_&&K(this.last_,(i,s)=>{t[i]=t[i]-s}),this.last_=e,t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ao=10*1e3,dm=30*1e3,fm=5*60*1e3;class pm{constructor(e,t){this.server_=t,this.statsToReport_={},this.statsListener_=new hm(e);const i=ao+(dm-ao)*Math.random();Wt(this.reportStats_.bind(this),Math.floor(i))}reportStats_(){const e=this.statsListener_.get(),t={};let i=!1;K(e,(s,r)=>{r>0&&Ie(this.statsToReport_,s)&&(t[s]=r,i=!0)}),i&&this.server_.reportStats(t),Wt(this.reportStats_.bind(this),Math.floor(Math.random()*2*fm))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var te;(function(n){n[n.OVERWRITE=0]="OVERWRITE",n[n.MERGE=1]="MERGE",n[n.ACK_USER_WRITE=2]="ACK_USER_WRITE",n[n.LISTEN_COMPLETE=3]="LISTEN_COMPLETE"})(te||(te={}));function vc(){return{fromUser:!0,fromServer:!1,queryId:null,tagged:!1}}function Fs(){return{fromUser:!1,fromServer:!0,queryId:null,tagged:!1}}function Us(n){return{fromUser:!1,fromServer:!0,queryId:n,tagged:!0}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Jn{constructor(e,t,i){this.path=e,this.affectedTree=t,this.revert=i,this.type=te.ACK_USER_WRITE,this.source=vc()}operationForChild(e){if(b(this.path)){if(this.affectedTree.value!=null)return _(this.affectedTree.children.isEmpty(),"affectedTree should not have overlapping affected paths."),this;{const t=this.affectedTree.subtree(new k(e));return new Jn(S(),t,this.revert)}}else return _(I(this.path)===e,"operationForChild called for unrelated child."),new Jn(A(this.path),this.affectedTree,this.revert)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class en{constructor(e,t){this.source=e,this.path=t,this.type=te.LISTEN_COMPLETE}operationForChild(e){return b(this.path)?new en(this.source,S()):new en(this.source,A(this.path))}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Je{constructor(e,t,i){this.source=e,this.path=t,this.snap=i,this.type=te.OVERWRITE}operationForChild(e){return b(this.path)?new Je(this.source,S(),this.snap.getImmediateChild(e)):new Je(this.source,A(this.path),this.snap)}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class tn{constructor(e,t,i){this.source=e,this.path=t,this.children=i,this.type=te.MERGE}operationForChild(e){if(b(this.path)){const t=this.children.subtree(new k(e));return t.isEmpty()?null:t.value?new Je(this.source,S(),t.value):new tn(this.source,S(),t)}else return _(I(this.path)===e,"Can't get a merge for a child not on the path of the operation"),new tn(this.source,A(this.path),this.children)}toString(){return"Operation("+this.path+": "+this.source.toString()+" merge: "+this.children.toString()+")"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Xe{constructor(e,t,i){this.node_=e,this.fullyInitialized_=t,this.filtered_=i}isFullyInitialized(){return this.fullyInitialized_}isFiltered(){return this.filtered_}isCompleteForPath(e){if(b(e))return this.isFullyInitialized()&&!this.filtered_;const t=I(e);return this.isCompleteForChild(t)}isCompleteForChild(e){return this.isFullyInitialized()&&!this.filtered_||this.node_.hasChild(e)}getNode(){return this.node_}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class mm{constructor(e){this.query_=e,this.index_=this.query_._queryParams.getIndex()}}function _m(n,e,t,i){const s=[],r=[];return e.forEach(o=>{o.type==="child_changed"&&n.index_.indexedValueChanged(o.oldSnap,o.snapshotNode)&&r.push(om(o.childName,o.snapshotNode))}),xt(n,s,"child_removed",e,i,t),xt(n,s,"child_added",e,i,t),xt(n,s,"child_moved",r,i,t),xt(n,s,"child_changed",e,i,t),xt(n,s,"value",e,i,t),s}function xt(n,e,t,i,s,r){const o=i.filter(a=>a.type===t);o.sort((a,c)=>vm(n,a,c)),o.forEach(a=>{const c=gm(n,a,r);s.forEach(l=>{l.respondsTo(a.type)&&e.push(l.createEvent(c,n.query_))})})}function gm(n,e,t){return e.type==="value"||e.type==="child_removed"||(e.prevName=t.getPredecessorChildName(e.childName,e.snapshotNode,n.index_)),e}function vm(n,e,t){if(e.childName==null||t.childName==null)throw Et("Should only compare child_ events.");const i=new C(e.childName,e.snapshotNode),s=new C(t.childName,t.snapshotNode);return n.index_.compare(i,s)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function pi(n,e){return{eventCache:n,serverCache:e}}function Bt(n,e,t,i){return pi(new Xe(e,t,i),n.serverCache)}function yc(n,e,t,i){return pi(n.eventCache,new Xe(e,t,i))}function ns(n){return n.eventCache.isFullyInitialized()?n.eventCache.getNode():null}function Ze(n){return n.serverCache.isFullyInitialized()?n.serverCache.getNode():null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let Li;const ym=()=>(Li||(Li=new z(sp)),Li);class R{constructor(e,t=ym()){this.value=e,this.children=t}static fromObject(e){let t=new R(null);return K(e,(i,s)=>{t=t.set(new k(i),s)}),t}isEmpty(){return this.value===null&&this.children.isEmpty()}findRootMostMatchingPathAndValue(e,t){if(this.value!=null&&t(this.value))return{path:S(),value:this.value};if(b(e))return null;{const i=I(e),s=this.children.get(i);if(s!==null){const r=s.findRootMostMatchingPathAndValue(A(e),t);return r!=null?{path:F(new k(i),r.path),value:r.value}:null}else return null}}findRootMostValueAndPath(e){return this.findRootMostMatchingPathAndValue(e,()=>!0)}subtree(e){if(b(e))return this;{const t=I(e),i=this.children.get(t);return i!==null?i.subtree(A(e)):new R(null)}}set(e,t){if(b(e))return new R(t,this.children);{const i=I(e),r=(this.children.get(i)||new R(null)).set(A(e),t),o=this.children.insert(i,r);return new R(this.value,o)}}remove(e){if(b(e))return this.children.isEmpty()?new R(null):new R(null,this.children);{const t=I(e),i=this.children.get(t);if(i){const s=i.remove(A(e));let r;return s.isEmpty()?r=this.children.remove(t):r=this.children.insert(t,s),this.value===null&&r.isEmpty()?new R(null):new R(this.value,r)}else return this}}get(e){if(b(e))return this.value;{const t=I(e),i=this.children.get(t);return i?i.get(A(e)):null}}setTree(e,t){if(b(e))return t;{const i=I(e),r=(this.children.get(i)||new R(null)).setTree(A(e),t);let o;return r.isEmpty()?o=this.children.remove(i):o=this.children.insert(i,r),new R(this.value,o)}}fold(e){return this.fold_(S(),e)}fold_(e,t){const i={};return this.children.inorderTraversal((s,r)=>{i[s]=r.fold_(F(e,s),t)}),t(e,this.value,i)}findOnPath(e,t){return this.findOnPath_(e,S(),t)}findOnPath_(e,t,i){const s=this.value?i(t,this.value):!1;if(s)return s;if(b(e))return null;{const r=I(e),o=this.children.get(r);return o?o.findOnPath_(A(e),F(t,r),i):null}}foreachOnPath(e,t){return this.foreachOnPath_(e,S(),t)}foreachOnPath_(e,t,i){if(b(e))return this;{this.value&&i(t,this.value);const s=I(e),r=this.children.get(s);return r?r.foreachOnPath_(A(e),F(t,s),i):new R(null)}}foreach(e){this.foreach_(S(),e)}foreach_(e,t){this.children.inorderTraversal((i,s)=>{s.foreach_(F(e,i),t)}),this.value&&t(e,this.value)}foreachChild(e){this.children.inorderTraversal((t,i)=>{i.value&&e(t,i.value)})}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class ie{constructor(e){this.writeTree_=e}static empty(){return new ie(new R(null))}}function Ht(n,e,t){if(b(e))return new ie(new R(t));{const i=n.writeTree_.findRootMostValueAndPath(e);if(i!=null){const s=i.path;let r=i.value;const o=j(s,e);return r=r.updateChild(o,t),new ie(n.writeTree_.set(s,r))}else{const s=new R(t),r=n.writeTree_.setTree(e,s);return new ie(r)}}}function co(n,e,t){let i=n;return K(t,(s,r)=>{i=Ht(i,F(e,s),r)}),i}function lo(n,e){if(b(e))return ie.empty();{const t=n.writeTree_.setTree(e,new R(null));return new ie(t)}}function is(n,e){return et(n,e)!=null}function et(n,e){const t=n.writeTree_.findRootMostValueAndPath(e);return t!=null?n.writeTree_.get(t.path).getChild(j(t.path,e)):null}function uo(n){const e=[],t=n.writeTree_.value;return t!=null?t.isLeafNode()||t.forEachChild(x,(i,s)=>{e.push(new C(i,s))}):n.writeTree_.children.inorderTraversal((i,s)=>{s.value!=null&&e.push(new C(i,s.value))}),e}function xe(n,e){if(b(e))return n;{const t=et(n,e);return t!=null?new ie(new R(t)):new ie(n.writeTree_.subtree(e))}}function ss(n){return n.writeTree_.isEmpty()}function yt(n,e){return wc(S(),n.writeTree_,e)}function wc(n,e,t){if(e.value!=null)return t.updateChild(n,e.value);{let i=null;return e.children.inorderTraversal((s,r)=>{s===".priority"?(_(r.value!==null,"Priority writes must always be leaf nodes"),i=r.value):t=wc(F(n,s),r,t)}),!t.getChild(n).isEmpty()&&i!==null&&(t=t.updateChild(F(n,".priority"),i)),t}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function $s(n,e){return bc(e,n)}function wm(n,e,t,i,s){_(i>n.lastWriteId,"Stacking an older write on top of newer ones"),s===void 0&&(s=!0),n.allWrites.push({path:e,snap:t,writeId:i,visible:s}),s&&(n.visibleWrites=Ht(n.visibleWrites,e,t)),n.lastWriteId=i}function Em(n,e){for(let t=0;t<n.allWrites.length;t++){const i=n.allWrites[t];if(i.writeId===e)return i}return null}function Im(n,e){const t=n.allWrites.findIndex(a=>a.writeId===e);_(t>=0,"removeWrite called with nonexistent writeId.");const i=n.allWrites[t];n.allWrites.splice(t,1);let s=i.visible,r=!1,o=n.allWrites.length-1;for(;s&&o>=0;){const a=n.allWrites[o];a.visible&&(o>=t&&Cm(a,i.path)?s=!1:ee(i.path,a.path)&&(r=!0)),o--}if(s){if(r)return bm(n),!0;if(i.snap)n.visibleWrites=lo(n.visibleWrites,i.path);else{const a=i.children;K(a,c=>{n.visibleWrites=lo(n.visibleWrites,F(i.path,c))})}return!0}else return!1}function Cm(n,e){if(n.snap)return ee(n.path,e);for(const t in n.children)if(n.children.hasOwnProperty(t)&&ee(F(n.path,t),e))return!0;return!1}function bm(n){n.visibleWrites=Ec(n.allWrites,Sm,S()),n.allWrites.length>0?n.lastWriteId=n.allWrites[n.allWrites.length-1].writeId:n.lastWriteId=-1}function Sm(n){return n.visible}function Ec(n,e,t){let i=ie.empty();for(let s=0;s<n.length;++s){const r=n[s];if(e(r)){const o=r.path;let a;if(r.snap)ee(t,o)?(a=j(t,o),i=Ht(i,a,r.snap)):ee(o,t)&&(a=j(o,t),i=Ht(i,S(),r.snap.getChild(a)));else if(r.children){if(ee(t,o))a=j(t,o),i=co(i,a,r.children);else if(ee(o,t))if(a=j(o,t),b(a))i=co(i,S(),r.children);else{const c=mt(r.children,I(a));if(c){const l=c.getChild(A(a));i=Ht(i,S(),l)}}}else throw Et("WriteRecord should have .snap or .children")}}return i}function Ic(n,e,t,i,s){if(!i&&!s){const r=et(n.visibleWrites,e);if(r!=null)return r;{const o=xe(n.visibleWrites,e);if(ss(o))return t;if(t==null&&!is(o,S()))return null;{const a=t||y.EMPTY_NODE;return yt(o,a)}}}else{const r=xe(n.visibleWrites,e);if(!s&&ss(r))return t;if(!s&&t==null&&!is(r,S()))return null;{const o=function(l){return(l.visible||s)&&(!i||!~i.indexOf(l.writeId))&&(ee(l.path,e)||ee(e,l.path))},a=Ec(n.allWrites,o,e),c=t||y.EMPTY_NODE;return yt(a,c)}}}function Tm(n,e,t){let i=y.EMPTY_NODE;const s=et(n.visibleWrites,e);if(s)return s.isLeafNode()||s.forEachChild(x,(r,o)=>{i=i.updateImmediateChild(r,o)}),i;if(t){const r=xe(n.visibleWrites,e);return t.forEachChild(x,(o,a)=>{const c=yt(xe(r,new k(o)),a);i=i.updateImmediateChild(o,c)}),uo(r).forEach(o=>{i=i.updateImmediateChild(o.name,o.node)}),i}else{const r=xe(n.visibleWrites,e);return uo(r).forEach(o=>{i=i.updateImmediateChild(o.name,o.node)}),i}}function km(n,e,t,i,s){_(i||s,"Either existingEventSnap or existingServerSnap must exist");const r=F(e,t);if(is(n.visibleWrites,r))return null;{const o=xe(n.visibleWrites,r);return ss(o)?s.getChild(t):yt(o,s.getChild(t))}}function Am(n,e,t,i){const s=F(e,t),r=et(n.visibleWrites,s);if(r!=null)return r;if(i.isCompleteForChild(t)){const o=xe(n.visibleWrites,s);return yt(o,i.getNode().getImmediateChild(t))}else return null}function Rm(n,e){return et(n.visibleWrites,e)}function Nm(n,e,t,i,s,r,o){let a;const c=xe(n.visibleWrites,e),l=et(c,S());if(l!=null)a=l;else if(t!=null)a=yt(c,t);else return[];if(a=a.withIndex(o),!a.isEmpty()&&!a.isLeafNode()){const h=[],u=o.getCompare(),d=r?a.getReverseIteratorFrom(i,o):a.getIteratorFrom(i,o);let f=d.getNext();for(;f&&h.length<s;)u(f,i)!==0&&h.push(f),f=d.getNext();return h}else return[]}function Pm(){return{visibleWrites:ie.empty(),allWrites:[],lastWriteId:-1}}function Xn(n,e,t,i){return Ic(n.writeTree,n.treePath,e,t,i)}function Ws(n,e){return Tm(n.writeTree,n.treePath,e)}function ho(n,e,t,i){return km(n.writeTree,n.treePath,e,t,i)}function Zn(n,e){return Rm(n.writeTree,F(n.treePath,e))}function Om(n,e,t,i,s,r){return Nm(n.writeTree,n.treePath,e,t,i,s,r)}function Bs(n,e,t){return Am(n.writeTree,n.treePath,e,t)}function Cc(n,e){return bc(F(n.treePath,e),n.writeTree)}function bc(n,e){return{treePath:n,writeTree:e}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Dm{constructor(){this.changeMap=new Map}trackChildChange(e){const t=e.type,i=e.childName;_(t==="child_added"||t==="child_changed"||t==="child_removed","Only child changes supported for tracking"),_(i!==".priority","Only non-priority child changes can be tracked.");const s=this.changeMap.get(i);if(s){const r=s.type;if(t==="child_added"&&r==="child_removed")this.changeMap.set(i,Xt(i,e.snapshotNode,s.snapshotNode));else if(t==="child_removed"&&r==="child_added")this.changeMap.delete(i);else if(t==="child_removed"&&r==="child_changed")this.changeMap.set(i,Jt(i,s.oldSnap));else if(t==="child_changed"&&r==="child_added")this.changeMap.set(i,vt(i,e.snapshotNode));else if(t==="child_changed"&&r==="child_changed")this.changeMap.set(i,Xt(i,e.snapshotNode,s.oldSnap));else throw Et("Illegal combination of changes: "+e+" occurred after "+s)}else this.changeMap.set(i,e)}getChanges(){return Array.from(this.changeMap.values())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class xm{getCompleteChild(e){return null}getChildAfterChild(e,t,i){return null}}const Sc=new xm;class Hs{constructor(e,t,i=null){this.writes_=e,this.viewCache_=t,this.optCompleteServerCache_=i}getCompleteChild(e){const t=this.viewCache_.eventCache;if(t.isCompleteForChild(e))return t.getNode().getImmediateChild(e);{const i=this.optCompleteServerCache_!=null?new Xe(this.optCompleteServerCache_,!0,!1):this.viewCache_.serverCache;return Bs(this.writes_,e,i)}}getChildAfterChild(e,t,i){const s=this.optCompleteServerCache_!=null?this.optCompleteServerCache_:Ze(this.viewCache_),r=Om(this.writes_,s,t,1,i,e);return r.length===0?null:r[0]}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Lm(n){return{filter:n}}function Mm(n,e){_(e.eventCache.getNode().isIndexed(n.filter.getIndex()),"Event snap not indexed"),_(e.serverCache.getNode().isIndexed(n.filter.getIndex()),"Server snap not indexed")}function Fm(n,e,t,i,s){const r=new Dm;let o,a;if(t.type===te.OVERWRITE){const l=t;l.source.fromUser?o=rs(n,e,l.path,l.snap,i,s,r):(_(l.source.fromServer,"Unknown source."),a=l.source.tagged||e.serverCache.isFiltered()&&!b(l.path),o=ei(n,e,l.path,l.snap,i,s,a,r))}else if(t.type===te.MERGE){const l=t;l.source.fromUser?o=$m(n,e,l.path,l.children,i,s,r):(_(l.source.fromServer,"Unknown source."),a=l.source.tagged||e.serverCache.isFiltered(),o=os(n,e,l.path,l.children,i,s,a,r))}else if(t.type===te.ACK_USER_WRITE){const l=t;l.revert?o=Hm(n,e,l.path,i,s,r):o=Wm(n,e,l.path,l.affectedTree,i,s,r)}else if(t.type===te.LISTEN_COMPLETE)o=Bm(n,e,t.path,i,r);else throw Et("Unknown operation type: "+t.type);const c=r.getChanges();return Um(e,o,c),{viewCache:o,changes:c}}function Um(n,e,t){const i=e.eventCache;if(i.isFullyInitialized()){const s=i.getNode().isLeafNode()||i.getNode().isEmpty(),r=ns(n);(t.length>0||!n.eventCache.isFullyInitialized()||s&&!i.getNode().equals(r)||!i.getNode().getPriority().equals(r.getPriority()))&&t.push(_c(ns(e)))}}function Tc(n,e,t,i,s,r){const o=e.eventCache;if(Zn(i,t)!=null)return e;{let a,c;if(b(t))if(_(e.serverCache.isFullyInitialized(),"If change path is empty, we must have complete server data"),e.serverCache.isFiltered()){const l=Ze(e),h=l instanceof y?l:y.EMPTY_NODE,u=Ws(i,h);a=n.filter.updateFullNode(e.eventCache.getNode(),u,r)}else{const l=Xn(i,Ze(e));a=n.filter.updateFullNode(e.eventCache.getNode(),l,r)}else{const l=I(t);if(l===".priority"){_(Me(t)===1,"Can't have a priority with additional path components");const h=o.getNode();c=e.serverCache.getNode();const u=ho(i,t,h,c);u!=null?a=n.filter.updatePriority(h,u):a=o.getNode()}else{const h=A(t);let u;if(o.isCompleteForChild(l)){c=e.serverCache.getNode();const d=ho(i,t,o.getNode(),c);d!=null?u=o.getNode().getImmediateChild(l).updateChild(h,d):u=o.getNode().getImmediateChild(l)}else u=Bs(i,l,e.serverCache);u!=null?a=n.filter.updateChild(o.getNode(),l,u,h,s,r):a=o.getNode()}}return Bt(e,a,o.isFullyInitialized()||b(t),n.filter.filtersNodes())}}function ei(n,e,t,i,s,r,o,a){const c=e.serverCache;let l;const h=o?n.filter:n.filter.getIndexedFilter();if(b(t))l=h.updateFullNode(c.getNode(),i,null);else if(h.filtersNodes()&&!c.isFiltered()){const f=c.getNode().updateChild(t,i);l=h.updateFullNode(c.getNode(),f,null)}else{const f=I(t);if(!c.isCompleteForPath(t)&&Me(t)>1)return e;const m=A(t),E=c.getNode().getImmediateChild(f).updateChild(m,i);f===".priority"?l=h.updatePriority(c.getNode(),E):l=h.updateChild(c.getNode(),f,E,m,Sc,null)}const u=yc(e,l,c.isFullyInitialized()||b(t),h.filtersNodes()),d=new Hs(s,u,r);return Tc(n,u,t,s,d,a)}function rs(n,e,t,i,s,r,o){const a=e.eventCache;let c,l;const h=new Hs(s,e,r);if(b(t))l=n.filter.updateFullNode(e.eventCache.getNode(),i,o),c=Bt(e,l,!0,n.filter.filtersNodes());else{const u=I(t);if(u===".priority")l=n.filter.updatePriority(e.eventCache.getNode(),i),c=Bt(e,l,a.isFullyInitialized(),a.isFiltered());else{const d=A(t),f=a.getNode().getImmediateChild(u);let m;if(b(d))m=i;else{const v=h.getCompleteChild(u);v!=null?ac(d)===".priority"&&v.getChild(lc(d)).isEmpty()?m=v:m=v.updateChild(d,i):m=y.EMPTY_NODE}if(f.equals(m))c=e;else{const v=n.filter.updateChild(a.getNode(),u,m,d,h,o);c=Bt(e,v,a.isFullyInitialized(),n.filter.filtersNodes())}}}return c}function fo(n,e){return n.eventCache.isCompleteForChild(e)}function $m(n,e,t,i,s,r,o){let a=e;return i.foreach((c,l)=>{const h=F(t,c);fo(e,I(h))&&(a=rs(n,a,h,l,s,r,o))}),i.foreach((c,l)=>{const h=F(t,c);fo(e,I(h))||(a=rs(n,a,h,l,s,r,o))}),a}function po(n,e,t){return t.foreach((i,s)=>{e=e.updateChild(i,s)}),e}function os(n,e,t,i,s,r,o,a){if(e.serverCache.getNode().isEmpty()&&!e.serverCache.isFullyInitialized())return e;let c=e,l;b(t)?l=i:l=new R(null).setTree(t,i);const h=e.serverCache.getNode();return l.children.inorderTraversal((u,d)=>{if(h.hasChild(u)){const f=e.serverCache.getNode().getImmediateChild(u),m=po(n,f,d);c=ei(n,c,new k(u),m,s,r,o,a)}}),l.children.inorderTraversal((u,d)=>{const f=!e.serverCache.isCompleteForChild(u)&&d.value===null;if(!h.hasChild(u)&&!f){const m=e.serverCache.getNode().getImmediateChild(u),v=po(n,m,d);c=ei(n,c,new k(u),v,s,r,o,a)}}),c}function Wm(n,e,t,i,s,r,o){if(Zn(s,t)!=null)return e;const a=e.serverCache.isFiltered(),c=e.serverCache;if(i.value!=null){if(b(t)&&c.isFullyInitialized()||c.isCompleteForPath(t))return ei(n,e,t,c.getNode().getChild(t),s,r,a,o);if(b(t)){let l=new R(null);return c.getNode().forEachChild(ft,(h,u)=>{l=l.set(new k(h),u)}),os(n,e,t,l,s,r,a,o)}else return e}else{let l=new R(null);return i.foreach((h,u)=>{const d=F(t,h);c.isCompleteForPath(d)&&(l=l.set(h,c.getNode().getChild(d)))}),os(n,e,t,l,s,r,a,o)}}function Bm(n,e,t,i,s){const r=e.serverCache,o=yc(e,r.getNode(),r.isFullyInitialized()||b(t),r.isFiltered());return Tc(n,o,t,i,Sc,s)}function Hm(n,e,t,i,s,r){let o;if(Zn(i,t)!=null)return e;{const a=new Hs(i,e,s),c=e.eventCache.getNode();let l;if(b(t)||I(t)===".priority"){let h;if(e.serverCache.isFullyInitialized())h=Xn(i,Ze(e));else{const u=e.serverCache.getNode();_(u instanceof y,"serverChildren would be complete if leaf node"),h=Ws(i,u)}h=h,l=n.filter.updateFullNode(c,h,r)}else{const h=I(t);let u=Bs(i,h,e.serverCache);u==null&&e.serverCache.isCompleteForChild(h)&&(u=c.getImmediateChild(h)),u!=null?l=n.filter.updateChild(c,h,u,A(t),a,r):e.eventCache.getNode().hasChild(h)?l=n.filter.updateChild(c,h,y.EMPTY_NODE,A(t),a,r):l=c,l.isEmpty()&&e.serverCache.isFullyInitialized()&&(o=Xn(i,Ze(e)),o.isLeafNode()&&(l=n.filter.updateFullNode(l,o,r)))}return o=e.serverCache.isFullyInitialized()||Zn(i,S())!=null,Bt(e,l,o,n.filter.filtersNodes())}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Vm{constructor(e,t){this.query_=e,this.eventRegistrations_=[];const i=this.query_._queryParams,s=new Ls(i.getIndex()),r=cm(i);this.processor_=Lm(r);const o=t.serverCache,a=t.eventCache,c=s.updateFullNode(y.EMPTY_NODE,o.getNode(),null),l=r.updateFullNode(y.EMPTY_NODE,a.getNode(),null),h=new Xe(c,o.isFullyInitialized(),s.filtersNodes()),u=new Xe(l,a.isFullyInitialized(),r.filtersNodes());this.viewCache_=pi(u,h),this.eventGenerator_=new mm(this.query_)}get query(){return this.query_}}function qm(n){return n.viewCache_.serverCache.getNode()}function jm(n,e){const t=Ze(n.viewCache_);return t&&(n.query._queryParams.loadsAllData()||!b(e)&&!t.getImmediateChild(I(e)).isEmpty())?t.getChild(e):null}function mo(n){return n.eventRegistrations_.length===0}function zm(n,e){n.eventRegistrations_.push(e)}function _o(n,e,t){const i=[];if(t){_(e==null,"A cancel should cancel all event registrations.");const s=n.query._path;n.eventRegistrations_.forEach(r=>{const o=r.createCancelEvent(t,s);o&&i.push(o)})}if(e){let s=[];for(let r=0;r<n.eventRegistrations_.length;++r){const o=n.eventRegistrations_[r];if(!o.matches(e))s.push(o);else if(e.hasAnyCallback()){s=s.concat(n.eventRegistrations_.slice(r+1));break}}n.eventRegistrations_=s}else n.eventRegistrations_=[];return i}function go(n,e,t,i){e.type===te.MERGE&&e.source.queryId!==null&&(_(Ze(n.viewCache_),"We should always have a full cache before handling merges"),_(ns(n.viewCache_),"Missing event cache, even though we have a server cache"));const s=n.viewCache_,r=Fm(n.processor_,s,e,t,i);return Mm(n.processor_,r.viewCache),_(r.viewCache.serverCache.isFullyInitialized()||!s.serverCache.isFullyInitialized(),"Once a server snap is complete, it should never go back"),n.viewCache_=r.viewCache,kc(n,r.changes,r.viewCache.eventCache.getNode(),null)}function Gm(n,e){const t=n.viewCache_.eventCache,i=[];return t.getNode().isLeafNode()||t.getNode().forEachChild(x,(r,o)=>{i.push(vt(r,o))}),t.isFullyInitialized()&&i.push(_c(t.getNode())),kc(n,i,t.getNode(),e)}function kc(n,e,t,i){const s=i?[i]:n.eventRegistrations_;return _m(n.eventGenerator_,e,t,s)}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ti;class Km{constructor(){this.views=new Map}}function Ym(n){_(!ti,"__referenceConstructor has already been defined"),ti=n}function Qm(){return _(ti,"Reference.ts has not been loaded"),ti}function Jm(n){return n.views.size===0}function Vs(n,e,t,i){const s=e.source.queryId;if(s!==null){const r=n.views.get(s);return _(r!=null,"SyncTree gave us an op for an invalid query."),go(r,e,t,i)}else{let r=[];for(const o of n.views.values())r=r.concat(go(o,e,t,i));return r}}function Xm(n,e,t,i,s){const r=e._queryIdentifier,o=n.views.get(r);if(!o){let a=Xn(t,s?i:null),c=!1;a?c=!0:i instanceof y?(a=Ws(t,i),c=!1):(a=y.EMPTY_NODE,c=!1);const l=pi(new Xe(a,c,!1),new Xe(i,s,!1));return new Vm(e,l)}return o}function Zm(n,e,t,i,s,r){const o=Xm(n,e,i,s,r);return n.views.has(e._queryIdentifier)||n.views.set(e._queryIdentifier,o),zm(o,t),Gm(o,t)}function e_(n,e,t,i){const s=e._queryIdentifier,r=[];let o=[];const a=Fe(n);if(s==="default")for(const[c,l]of n.views.entries())o=o.concat(_o(l,t,i)),mo(l)&&(n.views.delete(c),l.query._queryParams.loadsAllData()||r.push(l.query));else{const c=n.views.get(s);c&&(o=o.concat(_o(c,t,i)),mo(c)&&(n.views.delete(s),c.query._queryParams.loadsAllData()||r.push(c.query)))}return a&&!Fe(n)&&r.push(new(Qm())(e._repo,e._path)),{removed:r,events:o}}function Ac(n){const e=[];for(const t of n.views.values())t.query._queryParams.loadsAllData()||e.push(t);return e}function pt(n,e){let t=null;for(const i of n.views.values())t=t||jm(i,e);return t}function Rc(n,e){if(e._queryParams.loadsAllData())return mi(n);{const i=e._queryIdentifier;return n.views.get(i)}}function Nc(n,e){return Rc(n,e)!=null}function Fe(n){return mi(n)!=null}function mi(n){for(const e of n.views.values())if(e.query._queryParams.loadsAllData())return e;return null}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */let ni;function t_(n){_(!ni,"__referenceConstructor has already been defined"),ni=n}function n_(){return _(ni,"Reference.ts has not been loaded"),ni}let i_=1;class vo{constructor(e){this.listenProvider_=e,this.syncPointTree_=new R(null),this.pendingWriteTree_=Pm(),this.tagToQueryMap=new Map,this.queryToTagMap=new Map}}function Pc(n,e,t,i,s){return wm(n.pendingWriteTree_,e,t,i,s),s?hn(n,new Je(vc(),e,t)):[]}function je(n,e,t=!1){const i=Em(n.pendingWriteTree_,e);if(Im(n.pendingWriteTree_,e)){let r=new R(null);return i.snap!=null?r=r.set(S(),!0):K(i.children,o=>{r=r.set(new k(o),!0)}),hn(n,new Jn(i.path,r,t))}else return[]}function _i(n,e,t){return hn(n,new Je(Fs(),e,t))}function s_(n,e,t){const i=R.fromObject(t);return hn(n,new tn(Fs(),e,i))}function r_(n,e){return hn(n,new en(Fs(),e))}function o_(n,e,t){const i=js(n,t);if(i){const s=zs(i),r=s.path,o=s.queryId,a=j(r,e),c=new en(Us(o),a);return Gs(n,r,c)}else return[]}function as(n,e,t,i,s=!1){const r=e._path,o=n.syncPointTree_.get(r);let a=[];if(o&&(e._queryIdentifier==="default"||Nc(o,e))){const c=e_(o,e,t,i);Jm(o)&&(n.syncPointTree_=n.syncPointTree_.remove(r));const l=c.removed;if(a=c.events,!s){const h=l.findIndex(d=>d._queryParams.loadsAllData())!==-1,u=n.syncPointTree_.findOnPath(r,(d,f)=>Fe(f));if(h&&!u){const d=n.syncPointTree_.subtree(r);if(!d.isEmpty()){const f=l_(d);for(let m=0;m<f.length;++m){const v=f[m],E=v.query,N=xc(n,v);n.listenProvider_.startListening(Vt(E),ii(n,E),N.hashFn,N.onComplete)}}}!u&&l.length>0&&!i&&(h?n.listenProvider_.stopListening(Vt(e),null):l.forEach(d=>{const f=n.queryToTagMap.get(gi(d));n.listenProvider_.stopListening(Vt(d),f)}))}u_(n,l)}return a}function a_(n,e,t,i){const s=js(n,i);if(s!=null){const r=zs(s),o=r.path,a=r.queryId,c=j(o,e),l=new Je(Us(a),c,t);return Gs(n,o,l)}else return[]}function c_(n,e,t,i){const s=js(n,i);if(s){const r=zs(s),o=r.path,a=r.queryId,c=j(o,e),l=R.fromObject(t),h=new tn(Us(a),c,l);return Gs(n,o,h)}else return[]}function yo(n,e,t,i=!1){const s=e._path;let r=null,o=!1;n.syncPointTree_.foreachOnPath(s,(d,f)=>{const m=j(d,s);r=r||pt(f,m),o=o||Fe(f)});let a=n.syncPointTree_.get(s);a?(o=o||Fe(a),r=r||pt(a,S())):(a=new Km,n.syncPointTree_=n.syncPointTree_.set(s,a));let c;r!=null?c=!0:(c=!1,r=y.EMPTY_NODE,n.syncPointTree_.subtree(s).foreachChild((f,m)=>{const v=pt(m,S());v&&(r=r.updateImmediateChild(f,v))}));const l=Nc(a,e);if(!l&&!e._queryParams.loadsAllData()){const d=gi(e);_(!n.queryToTagMap.has(d),"View does not exist, but we have a tag");const f=h_();n.queryToTagMap.set(d,f),n.tagToQueryMap.set(f,d)}const h=$s(n.pendingWriteTree_,s);let u=Zm(a,e,t,h,r,c);if(!l&&!o&&!i){const d=Rc(a,e);u=u.concat(d_(n,e,d))}return u}function qs(n,e,t){const s=n.pendingWriteTree_,r=n.syncPointTree_.findOnPath(e,(o,a)=>{const c=j(o,e),l=pt(a,c);if(l)return l});return Ic(s,e,r,t,!0)}function hn(n,e){return Oc(e,n.syncPointTree_,null,$s(n.pendingWriteTree_,S()))}function Oc(n,e,t,i){if(b(n.path))return Dc(n,e,t,i);{const s=e.get(S());t==null&&s!=null&&(t=pt(s,S()));let r=[];const o=I(n.path),a=n.operationForChild(o),c=e.children.get(o);if(c&&a){const l=t?t.getImmediateChild(o):null,h=Cc(i,o);r=r.concat(Oc(a,c,l,h))}return s&&(r=r.concat(Vs(s,n,i,t))),r}}function Dc(n,e,t,i){const s=e.get(S());t==null&&s!=null&&(t=pt(s,S()));let r=[];return e.children.inorderTraversal((o,a)=>{const c=t?t.getImmediateChild(o):null,l=Cc(i,o),h=n.operationForChild(o);h&&(r=r.concat(Dc(h,a,c,l)))}),s&&(r=r.concat(Vs(s,n,i,t))),r}function xc(n,e){const t=e.query,i=ii(n,t);return{hashFn:()=>(qm(e)||y.EMPTY_NODE).hash(),onComplete:s=>{if(s==="ok")return i?o_(n,t._path,i):r_(n,t._path);{const r=ap(s,t);return as(n,t,null,r)}}}}function ii(n,e){const t=gi(e);return n.queryToTagMap.get(t)}function gi(n){return n._path.toString()+"$"+n._queryIdentifier}function js(n,e){return n.tagToQueryMap.get(e)}function zs(n){const e=n.indexOf("$");return _(e!==-1&&e<n.length-1,"Bad queryKey."),{queryId:n.substr(e+1),path:new k(n.substr(0,e))}}function Gs(n,e,t){const i=n.syncPointTree_.get(e);_(i,"Missing sync point for query tag that we're tracking");const s=$s(n.pendingWriteTree_,e);return Vs(i,t,s,null)}function l_(n){return n.fold((e,t,i)=>{if(t&&Fe(t))return[mi(t)];{let s=[];return t&&(s=Ac(t)),K(i,(r,o)=>{s=s.concat(o)}),s}})}function Vt(n){return n._queryParams.loadsAllData()&&!n._queryParams.isDefault()?new(n_())(n._repo,n._path):n}function u_(n,e){for(let t=0;t<e.length;++t){const i=e[t];if(!i._queryParams.loadsAllData()){const s=gi(i),r=n.queryToTagMap.get(s);n.queryToTagMap.delete(s),n.tagToQueryMap.delete(r)}}}function h_(){return i_++}function d_(n,e,t){const i=e._path,s=ii(n,e),r=xc(n,t),o=n.listenProvider_.startListening(Vt(e),s,r.hashFn,r.onComplete),a=n.syncPointTree_.subtree(i);if(s)_(!Fe(a.value),"If we're adding a query, it shouldn't be shadowed");else{const c=a.fold((l,h,u)=>{if(!b(l)&&h&&Fe(h))return[mi(h).query];{let d=[];return h&&(d=d.concat(Ac(h).map(f=>f.query))),K(u,(f,m)=>{d=d.concat(m)}),d}});for(let l=0;l<c.length;++l){const h=c[l];n.listenProvider_.stopListening(Vt(h),ii(n,h))}}return o}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Ks{constructor(e){this.node_=e}getImmediateChild(e){const t=this.node_.getImmediateChild(e);return new Ks(t)}node(){return this.node_}}class Ys{constructor(e,t){this.syncTree_=e,this.path_=t}getImmediateChild(e){const t=F(this.path_,e);return new Ys(this.syncTree_,t)}node(){return qs(this.syncTree_,this.path_)}}const f_=function(n){return n=n||{},n.timestamp=n.timestamp||new Date().getTime(),n},wo=function(n,e,t){if(!n||typeof n!="object")return n;if(_(".sv"in n,"Unexpected leaf node or priority contents"),typeof n[".sv"]=="string")return p_(n[".sv"],e,t);if(typeof n[".sv"]=="object")return m_(n[".sv"],e);_(!1,"Unexpected server value: "+JSON.stringify(n,null,2))},p_=function(n,e,t){switch(n){case"timestamp":return t.timestamp;default:_(!1,"Unexpected server value: "+n)}},m_=function(n,e,t){n.hasOwnProperty("increment")||_(!1,"Unexpected server value: "+JSON.stringify(n,null,2));const i=n.increment;typeof i!="number"&&_(!1,"Unexpected increment value: "+i);const s=e.node();if(_(s!==null&&typeof s<"u","Expected ChildrenNode.EMPTY_NODE for nulls"),!s.isLeafNode())return i;const o=s.getValue();return typeof o!="number"?i:o+i},__=function(n,e,t,i){return Qs(e,new Ys(t,n),i)},Lc=function(n,e,t){return Qs(n,new Ks(e),t)};function Qs(n,e,t){const i=n.getPriority().val(),s=wo(i,e.getImmediateChild(".priority"),t);let r;if(n.isLeafNode()){const o=n,a=wo(o.getValue(),e,t);return a!==o.getValue()||s!==o.getPriority().val()?new U(a,B(s)):n}else{const o=n;return r=o,s!==o.getPriority().val()&&(r=r.updatePriority(new U(s))),o.forEachChild(x,(a,c)=>{const l=Qs(c,e.getImmediateChild(a),t);l!==c&&(r=r.updateImmediateChild(a,l))}),r}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Js{constructor(e="",t=null,i={children:{},childCount:0}){this.name=e,this.parent=t,this.node=i}}function Xs(n,e){let t=e instanceof k?e:new k(e),i=n,s=I(t);for(;s!==null;){const r=mt(i.node.children,s)||{children:{},childCount:0};i=new Js(s,i,r),t=A(t),s=I(t)}return i}function kt(n){return n.node.value}function Mc(n,e){n.node.value=e,cs(n)}function Fc(n){return n.node.childCount>0}function g_(n){return kt(n)===void 0&&!Fc(n)}function vi(n,e){K(n.node.children,(t,i)=>{e(new Js(t,n,i))})}function Uc(n,e,t,i){t&&e(n),vi(n,s=>{Uc(s,e,!0)})}function v_(n,e,t){let i=n.parent;for(;i!==null;){if(e(i))return!0;i=i.parent}return!1}function dn(n){return new k(n.parent===null?n.name:dn(n.parent)+"/"+n.name)}function cs(n){n.parent!==null&&y_(n.parent,n.name,n)}function y_(n,e,t){const i=g_(t),s=Ie(n.node.children,e);i&&s?(delete n.node.children[e],n.node.childCount--,cs(n)):!i&&!s&&(n.node.children[e]=t.node,n.node.childCount++,cs(n))}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const w_=/[\[\].#$\/\u0000-\u001F\u007F]/,E_=/[\[\].#$\u0000-\u001F\u007F]/,Mi=10*1024*1024,$c=function(n){return typeof n=="string"&&n.length!==0&&!w_.test(n)},Wc=function(n){return typeof n=="string"&&n.length!==0&&!E_.test(n)},I_=function(n){return n&&(n=n.replace(/^\/*\.info(\/|$)/,"/")),Wc(n)},C_=function(n,e,t,i){Zs(_s(n,"value"),e,t)},Zs=function(n,e,t){const i=t instanceof k?new Wp(t,n):t;if(e===void 0)throw new Error(n+"contains undefined "+Ve(i));if(typeof e=="function")throw new Error(n+"contains a function "+Ve(i)+" with contents = "+e.toString());if(Wa(e))throw new Error(n+"contains "+e.toString()+" "+Ve(i));if(typeof e=="string"&&e.length>Mi/3&&ci(e)>Mi)throw new Error(n+"contains a string greater than "+Mi+" utf8 bytes "+Ve(i)+" ('"+e.substring(0,50)+"...')");if(e&&typeof e=="object"){let s=!1,r=!1;if(K(e,(o,a)=>{if(o===".value")s=!0;else if(o!==".priority"&&o!==".sv"&&(r=!0,!$c(o)))throw new Error(n+" contains an invalid key ("+o+") "+Ve(i)+`.  Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"`);Bp(i,o),Zs(n,a,i),Hp(i)}),s&&r)throw new Error(n+' contains ".value" child '+Ve(i)+" in addition to actual children.")}},Bc=function(n,e,t,i){if(!Wc(t))throw new Error(_s(n,e)+'was an invalid path = "'+t+`". Paths must be non-empty strings and can't contain ".", "#", "$", "[", or "]"`)},b_=function(n,e,t,i){t&&(t=t.replace(/^\/*\.info(\/|$)/,"/")),Bc(n,e,t)},S_=function(n,e){if(I(e)===".info")throw new Error(n+" failed = Can't modify data under /.info/")},T_=function(n,e){const t=e.path.toString();if(typeof e.repoInfo.host!="string"||e.repoInfo.host.length===0||!$c(e.repoInfo.namespace)&&e.repoInfo.host.split(":")[0]!=="localhost"||t.length!==0&&!I_(t))throw new Error(_s(n,"url")+`must be a valid firebase URL and the path can't contain ".", "#", "$", "[", or "]".`)};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class k_{constructor(){this.eventLists_=[],this.recursionDepth_=0}}function er(n,e){let t=null;for(let i=0;i<e.length;i++){const s=e[i],r=s.getPath();t!==null&&!Os(r,t.path)&&(n.eventLists_.push(t),t=null),t===null&&(t={events:[],path:r}),t.events.push(s)}t&&n.eventLists_.push(t)}function Hc(n,e,t){er(n,t),Vc(n,i=>Os(i,e))}function Ee(n,e,t){er(n,t),Vc(n,i=>ee(i,e)||ee(e,i))}function Vc(n,e){n.recursionDepth_++;let t=!0;for(let i=0;i<n.eventLists_.length;i++){const s=n.eventLists_[i];if(s){const r=s.path;e(r)?(A_(n.eventLists_[i]),n.eventLists_[i]=null):t=!1}}t&&(n.eventLists_=[]),n.recursionDepth_--}function A_(n){for(let e=0;e<n.events.length;e++){const t=n.events[e];if(t!==null){n.events[e]=null;const i=t.getEventRunner();$t&&H("event: "+t.toString()),Tt(i)}}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const R_="repo_interrupt",N_=25;class P_{constructor(e,t,i,s){this.repoInfo_=e,this.forceRestClient_=t,this.authTokenProvider_=i,this.appCheckProvider_=s,this.dataUpdateCount=0,this.statsListener_=null,this.eventQueue_=new k_,this.nextWriteId_=1,this.interceptServerDataCallback_=null,this.onDisconnect_=Qn(),this.transactionQueueTree_=new Js,this.persistentConnection_=null,this.key=this.repoInfo_.toURLString()}toString(){return(this.repoInfo_.secure?"https://":"http://")+this.repoInfo_.host}}function O_(n,e,t){if(n.stats_=Ns(n.repoInfo_),n.forceRestClient_||hp())n.server_=new Yn(n.repoInfo_,(i,s,r,o)=>{Eo(n,i,s,r,o)},n.authTokenProvider_,n.appCheckProvider_),setTimeout(()=>Io(n,!0),0);else{if(typeof t<"u"&&t!==null){if(typeof t!="object")throw new Error("Only objects are supported for option databaseAuthVariableOverride");try{W(t)}catch(i){throw new Error("Invalid authOverride provided: "+i)}}n.persistentConnection_=new _e(n.repoInfo_,e,(i,s,r,o)=>{Eo(n,i,s,r,o)},i=>{Io(n,i)},i=>{x_(n,i)},n.authTokenProvider_,n.appCheckProvider_,t),n.server_=n.persistentConnection_}n.authTokenProvider_.addTokenChangeListener(i=>{n.server_.refreshAuthToken(i)}),n.appCheckProvider_.addTokenChangeListener(i=>{n.server_.refreshAppCheckToken(i.token)}),n.statsReporter_=_p(n.repoInfo_,()=>new pm(n.stats_,n.server_)),n.infoData_=new lm,n.infoSyncTree_=new vo({startListening:(i,s,r,o)=>{let a=[];const c=n.infoData_.getNode(i._path);return c.isEmpty()||(a=_i(n.infoSyncTree_,i._path,c),setTimeout(()=>{o("ok")},0)),a},stopListening:()=>{}}),nr(n,"connected",!1),n.serverSyncTree_=new vo({startListening:(i,s,r,o)=>(n.server_.listen(i,r,s,(a,c)=>{const l=o(a,c);Ee(n.eventQueue_,i._path,l)}),[]),stopListening:(i,s)=>{n.server_.unlisten(i,s)}})}function D_(n){const t=n.infoData_.getNode(new k(".info/serverTimeOffset")).val()||0;return new Date().getTime()+t}function tr(n){return f_({timestamp:D_(n)})}function Eo(n,e,t,i,s){n.dataUpdateCount++;const r=new k(e);t=n.interceptServerDataCallback_?n.interceptServerDataCallback_(e,t):t;let o=[];if(s)if(i){const c=Un(t,l=>B(l));o=c_(n.serverSyncTree_,r,c,s)}else{const c=B(t);o=a_(n.serverSyncTree_,r,c,s)}else if(i){const c=Un(t,l=>B(l));o=s_(n.serverSyncTree_,r,c)}else{const c=B(t);o=_i(n.serverSyncTree_,r,c)}let a=r;o.length>0&&(a=yi(n,r)),Ee(n.eventQueue_,a,o)}function Io(n,e){nr(n,"connected",e),e===!1&&M_(n)}function x_(n,e){K(e,(t,i)=>{nr(n,t,i)})}function nr(n,e,t){const i=new k("/.info/"+e),s=B(t);n.infoData_.updateSnapshot(i,s);const r=_i(n.infoSyncTree_,i,s);Ee(n.eventQueue_,i,r)}function qc(n){return n.nextWriteId_++}function L_(n,e,t,i,s){ir(n,"set",{path:e.toString(),value:t,priority:i});const r=tr(n),o=B(t,i),a=qs(n.serverSyncTree_,e),c=Lc(o,a,r),l=qc(n),h=Pc(n.serverSyncTree_,e,c,l,!0);er(n.eventQueue_,h),n.server_.put(e.toString(),o.val(!0),(d,f)=>{const m=d==="ok";m||G("set at "+e+" failed: "+d);const v=je(n.serverSyncTree_,l,!m);Ee(n.eventQueue_,e,v),W_(n,s,d,f)});const u=Yc(n,e);yi(n,u),Ee(n.eventQueue_,u,[])}function M_(n){ir(n,"onDisconnectEvents");const e=tr(n),t=Qn();ts(n.onDisconnect_,S(),(s,r)=>{const o=__(s,r,n.serverSyncTree_,e);gc(t,s,o)});let i=[];ts(t,S(),(s,r)=>{i=i.concat(_i(n.serverSyncTree_,s,r));const o=Yc(n,s);yi(n,o)}),n.onDisconnect_=Qn(),Ee(n.eventQueue_,S(),i)}function F_(n,e,t){let i;I(e._path)===".info"?i=yo(n.infoSyncTree_,e,t):i=yo(n.serverSyncTree_,e,t),Hc(n.eventQueue_,e._path,i)}function U_(n,e,t){let i;I(e._path)===".info"?i=as(n.infoSyncTree_,e,t):i=as(n.serverSyncTree_,e,t),Hc(n.eventQueue_,e._path,i)}function $_(n){n.persistentConnection_&&n.persistentConnection_.interrupt(R_)}function ir(n,...e){let t="";n.persistentConnection_&&(t=n.persistentConnection_.id+":"),H(t,...e)}function W_(n,e,t,i){e&&Tt(()=>{if(t==="ok")e(null);else{const s=(t||"error").toUpperCase();let r=s;i&&(r+=": "+i);const o=new Error(r);o.code=s,e(o)}})}function jc(n,e,t){return qs(n.serverSyncTree_,e,t)||y.EMPTY_NODE}function sr(n,e=n.transactionQueueTree_){if(e||wi(n,e),kt(e)){const t=Gc(n,e);_(t.length>0,"Sending zero length transaction queue"),t.every(s=>s.status===0)&&B_(n,dn(e),t)}else Fc(e)&&vi(e,t=>{sr(n,t)})}function B_(n,e,t){const i=t.map(l=>l.currentWriteId),s=jc(n,e,i);let r=s;const o=s.hash();for(let l=0;l<t.length;l++){const h=t[l];_(h.status===0,"tryToSendTransactionQueue_: items in queue should all be run."),h.status=1,h.retryCount++;const u=j(e,h.path);r=r.updateChild(u,h.currentOutputSnapshotRaw)}const a=r.val(!0),c=e;n.server_.put(c.toString(),a,l=>{ir(n,"transaction put response",{path:c.toString(),status:l});let h=[];if(l==="ok"){const u=[];for(let d=0;d<t.length;d++)t[d].status=2,h=h.concat(je(n.serverSyncTree_,t[d].currentWriteId)),t[d].onComplete&&u.push(()=>t[d].onComplete(null,!0,t[d].currentOutputSnapshotResolved)),t[d].unwatcher();wi(n,Xs(n.transactionQueueTree_,e)),sr(n,n.transactionQueueTree_),Ee(n.eventQueue_,e,h);for(let d=0;d<u.length;d++)Tt(u[d])}else{if(l==="datastale")for(let u=0;u<t.length;u++)t[u].status===3?t[u].status=4:t[u].status=0;else{G("transaction at "+c.toString()+" failed: "+l);for(let u=0;u<t.length;u++)t[u].status=4,t[u].abortReason=l}yi(n,e)}},o)}function yi(n,e){const t=zc(n,e),i=dn(t),s=Gc(n,t);return H_(n,s,i),i}function H_(n,e,t){if(e.length===0)return;const i=[];let s=[];const o=e.filter(a=>a.status===0).map(a=>a.currentWriteId);for(let a=0;a<e.length;a++){const c=e[a],l=j(t,c.path);let h=!1,u;if(_(l!==null,"rerunTransactionsUnderNode_: relativePath should not be null."),c.status===4)h=!0,u=c.abortReason,s=s.concat(je(n.serverSyncTree_,c.currentWriteId,!0));else if(c.status===0)if(c.retryCount>=N_)h=!0,u="maxretry",s=s.concat(je(n.serverSyncTree_,c.currentWriteId,!0));else{const d=jc(n,c.path,o);c.currentInputSnapshot=d;const f=e[a].update(d.val());if(f!==void 0){Zs("transaction failed: Data returned ",f,c.path);let m=B(f);typeof f=="object"&&f!=null&&Ie(f,".priority")||(m=m.updatePriority(d.getPriority()));const E=c.currentWriteId,N=tr(n),P=Lc(m,d,N);c.currentOutputSnapshotRaw=m,c.currentOutputSnapshotResolved=P,c.currentWriteId=qc(n),o.splice(o.indexOf(E),1),s=s.concat(Pc(n.serverSyncTree_,c.path,P,c.currentWriteId,c.applyLocally)),s=s.concat(je(n.serverSyncTree_,E,!0))}else h=!0,u="nodata",s=s.concat(je(n.serverSyncTree_,c.currentWriteId,!0))}Ee(n.eventQueue_,t,s),s=[],h&&(e[a].status=2,function(d){setTimeout(d,Math.floor(0))}(e[a].unwatcher),e[a].onComplete&&(u==="nodata"?i.push(()=>e[a].onComplete(null,!1,e[a].currentInputSnapshot)):i.push(()=>e[a].onComplete(new Error(u),!1,null))))}wi(n,n.transactionQueueTree_);for(let a=0;a<i.length;a++)Tt(i[a]);sr(n,n.transactionQueueTree_)}function zc(n,e){let t,i=n.transactionQueueTree_;for(t=I(e);t!==null&&kt(i)===void 0;)i=Xs(i,t),e=A(e),t=I(e);return i}function Gc(n,e){const t=[];return Kc(n,e,t),t.sort((i,s)=>i.order-s.order),t}function Kc(n,e,t){const i=kt(e);if(i)for(let s=0;s<i.length;s++)t.push(i[s]);vi(e,s=>{Kc(n,s,t)})}function wi(n,e){const t=kt(e);if(t){let i=0;for(let s=0;s<t.length;s++)t[s].status!==2&&(t[i]=t[s],i++);t.length=i,Mc(e,t.length>0?t:void 0)}vi(e,i=>{wi(n,i)})}function Yc(n,e){const t=dn(zc(n,e)),i=Xs(n.transactionQueueTree_,e);return v_(i,s=>{Fi(n,s)}),Fi(n,i),Uc(i,s=>{Fi(n,s)}),t}function Fi(n,e){const t=kt(e);if(t){const i=[];let s=[],r=-1;for(let o=0;o<t.length;o++)t[o].status===3||(t[o].status===1?(_(r===o-1,"All SENT items should be at beginning of queue."),r=o,t[o].status=3,t[o].abortReason="set"):(_(t[o].status===0,"Unexpected transaction status in abort"),t[o].unwatcher(),s=s.concat(je(n.serverSyncTree_,t[o].currentWriteId,!0)),t[o].onComplete&&i.push(t[o].onComplete.bind(null,new Error("set"),!1,null))));r===-1?Mc(e,void 0):t.length=r+1,Ee(n.eventQueue_,dn(e),s);for(let o=0;o<i.length;o++)Tt(i[o])}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function V_(n){let e="";const t=n.split("/");for(let i=0;i<t.length;i++)if(t[i].length>0){let s=t[i];try{s=decodeURIComponent(s.replace(/\+/g," "))}catch{}e+="/"+s}return e}function q_(n){const e={};n.charAt(0)==="?"&&(n=n.substring(1));for(const t of n.split("&")){if(t.length===0)continue;const i=t.split("=");i.length===2?e[decodeURIComponent(i[0])]=decodeURIComponent(i[1]):G(`Invalid query segment '${t}' in query '${n}'`)}return e}const Co=function(n,e){const t=j_(n),i=t.namespace;t.domain==="firebase.com"&&we(t.host+" is no longer supported. Please use <YOUR FIREBASE>.firebaseio.com instead"),(!i||i==="undefined")&&t.domain!=="localhost"&&we("Cannot parse Firebase url. Please use https://<YOUR FIREBASE>.firebaseio.com"),t.secure||np();const s=t.scheme==="ws"||t.scheme==="wss";return{repoInfo:new Xa(t.host,t.secure,i,s,e,"",i!==t.subdomain),path:new k(t.pathString)}},j_=function(n){let e="",t="",i="",s="",r="",o=!0,a="https",c=443;if(typeof n=="string"){let l=n.indexOf("//");l>=0&&(a=n.substring(0,l-1),n=n.substring(l+2));let h=n.indexOf("/");h===-1&&(h=n.length);let u=n.indexOf("?");u===-1&&(u=n.length),e=n.substring(0,Math.min(h,u)),h<u&&(s=V_(n.substring(h,u)));const d=q_(n.substring(Math.min(n.length,u)));l=e.indexOf(":"),l>=0?(o=a==="https"||a==="wss",c=parseInt(e.substring(l+1),10)):l=e.length;const f=e.slice(0,l);if(f.toLowerCase()==="localhost")t="localhost";else if(f.split(".").length<=2)t=f;else{const m=e.indexOf(".");i=e.substring(0,m).toLowerCase(),t=e.substring(m+1),r=i}"ns"in d&&(r=d.ns)}return{host:e,port:c,domain:t,subdomain:i,secure:o,scheme:a,pathString:s,namespace:r}};/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class z_{constructor(e,t,i,s){this.eventType=e,this.eventRegistration=t,this.snapshot=i,this.prevName=s}getPath(){const e=this.snapshot.ref;return this.eventType==="value"?e._path:e.parent._path}getEventType(){return this.eventType}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.getPath().toString()+":"+this.eventType+":"+W(this.snapshot.exportVal())}}class G_{constructor(e,t,i){this.eventRegistration=e,this.error=t,this.path=i}getPath(){return this.path}getEventType(){return"cancel"}getEventRunner(){return this.eventRegistration.getEventRunner(this)}toString(){return this.path.toString()+":cancel"}}/**
 * @license
 * Copyright 2017 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class K_{constructor(e,t){this.snapshotCallback=e,this.cancelCallback=t}onValue(e,t){this.snapshotCallback.call(null,e,t)}onCancel(e){return _(this.hasCancelCallback,"Raising a cancel event on a listener with no cancel callback"),this.cancelCallback.call(null,e)}get hasCancelCallback(){return!!this.cancelCallback}matches(e){return this.snapshotCallback===e.snapshotCallback||this.snapshotCallback.userCallback!==void 0&&this.snapshotCallback.userCallback===e.snapshotCallback.userCallback&&this.snapshotCallback.context===e.snapshotCallback.context}}/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class rr{constructor(e,t,i,s){this._repo=e,this._path=t,this._queryParams=i,this._orderByCalled=s}get key(){return b(this._path)?null:ac(this._path)}get ref(){return new We(this._repo,this._path)}get _queryIdentifier(){const e=oo(this._queryParams),t=As(e);return t==="{}"?"default":t}get _queryObject(){return oo(this._queryParams)}isEqual(e){if(e=Q(e),!(e instanceof rr))return!1;const t=this._repo===e._repo,i=Os(this._path,e._path),s=this._queryIdentifier===e._queryIdentifier;return t&&i&&s}toJSON(){return this.toString()}toString(){return this._repo.toString()+$p(this._path)}}class We extends rr{constructor(e,t){super(e,t,new Ms,!1)}get parent(){const e=lc(this._path);return e===null?null:new We(this._repo,e)}get root(){let e=this;for(;e.parent!==null;)e=e.parent;return e}}class si{constructor(e,t,i){this._node=e,this.ref=t,this._index=i}get priority(){return this._node.getPriority().val()}get key(){return this.ref.key}get size(){return this._node.numChildren()}child(e){const t=new k(e),i=ls(this.ref,e);return new si(this._node.getChild(t),i,x)}exists(){return!this._node.isEmpty()}exportVal(){return this._node.val(!0)}forEach(e){return this._node.isLeafNode()?!1:!!this._node.forEachChild(this._index,(i,s)=>e(new si(s,ls(this.ref,i),x)))}hasChild(e){const t=new k(e);return!this._node.getChild(t).isEmpty()}hasChildren(){return this._node.isLeafNode()?!1:!this._node.isEmpty()}toJSON(){return this.exportVal()}val(){return this._node.val()}}function Qc(n,e){return n=Q(n),n._checkNotDeleted("ref"),e!==void 0?ls(n._root,e):n._root}function ls(n,e){return n=Q(n),I(n._path)===null?b_("child","path",e):Bc("child","path",e),new We(n._repo,F(n._path,e))}function Y_(n,e){n=Q(n),S_("set",n._path),C_("set",e,n._path);const t=new ai;return L_(n._repo,n._path,e,null,t.wrapCallback(()=>{})),t.promise}class or{constructor(e){this.callbackContext=e}respondsTo(e){return e==="value"}createEvent(e,t){const i=t._queryParams.getIndex();return new z_("value",this,new si(e.snapshotNode,new We(t._repo,t._path),i))}getEventRunner(e){return e.getEventType()==="cancel"?()=>this.callbackContext.onCancel(e.error):()=>this.callbackContext.onValue(e.snapshot,null)}createCancelEvent(e,t){return this.callbackContext.hasCancelCallback?new G_(this,e,t):null}matches(e){return e instanceof or?!e.callbackContext||!this.callbackContext?!0:e.callbackContext.matches(this.callbackContext):!1}hasAnyCallback(){return this.callbackContext!==null}}function Q_(n,e,t,i,s){const r=new K_(t,void 0),o=new or(r);return F_(n._repo,n,o),()=>U_(n._repo,n,o)}function J_(n,e,t,i){return Q_(n,"value",e)}Ym(We);t_(We);/**
 * @license
 * Copyright 2020 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const X_="FIREBASE_DATABASE_EMULATOR_HOST",us={};let Z_=!1;function eg(n,e,t,i){n.repoInfo_=new Xa(`${e}:${t}`,!1,n.repoInfo_.namespace,n.repoInfo_.webSocketOnly,n.repoInfo_.nodeAdmin,n.repoInfo_.persistenceKey,n.repoInfo_.includeNamespaceInQueryParams,!0),i&&(n.authTokenProvider_=i)}function tg(n,e,t,i,s){let r=i||n.options.databaseURL;r===void 0&&(n.options.projectId||we("Can't determine Firebase Database URL. Be sure to include  a Project ID when calling firebase.initializeApp()."),H("Using default host for project ",n.options.projectId),r=`${n.options.projectId}-default-rtdb.firebaseio.com`);let o=Co(r,s),a=o.repoInfo,c;typeof process<"u"&&Hr&&(c=Hr[X_]),c?(r=`http://${c}?ns=${a.namespace}`,o=Co(r,s),a=o.repoInfo):o.repoInfo.secure;const l=new fp(n.name,n.options,e);T_("Invalid Firebase Database URL",o),b(o.path)||we("Database URL must point to the root of a Firebase Database (not including a child path).");const h=ig(a,n,l,new dp(n.name,t));return new sg(h,n)}function ng(n,e){const t=us[e];(!t||t[n.key]!==n)&&we(`Database ${e}(${n.repoInfo_}) has already been deleted.`),$_(n),delete t[n.key]}function ig(n,e,t,i){let s=us[e.name];s||(s={},us[e.name]=s);let r=s[n.toURLString()];return r&&we("Database initialized multiple times. Please make sure the format of the database URL matches with each database() call."),r=new P_(n,Z_,t,i),s[n.toURLString()]=r,r}class sg{constructor(e,t){this._repoInternal=e,this.app=t,this.type="database",this._instanceStarted=!1}get _repo(){return this._instanceStarted||(O_(this._repoInternal,this.app.options.appId,this.app.options.databaseAuthVariableOverride),this._instanceStarted=!0),this._repoInternal}get _root(){return this._rootInternal||(this._rootInternal=new We(this._repo,S())),this._rootInternal}_delete(){return this._rootInternal!==null&&(ng(this._repo,this.app.name),this._repoInternal=null,this._rootInternal=null),Promise.resolve()}_checkNotDeleted(e){this._rootInternal===null&&we("Cannot call "+e+" on a deleted database.")}}function rg(n=ta(),e){const t=ys(n,"database").getImmediate({identifier:e});if(!t._instanceStarted){const i=Cu("database");i&&og(t,...i)}return t}function og(n,e,t,i={}){n=Q(n),n._checkNotDeleted("useEmulator"),n._instanceStarted&&we("Cannot call useEmulator() after instance has already been initialized.");const s=n._repoInternal;let r;if(s.repoInfo_.nodeAdmin)i.mockUserToken&&we('mockUserToken is not supported by the Admin SDK. For client access with mock users, please use the "firebase" package instead of "firebase-admin".'),r=new Tn(Tn.OWNER);else if(i.mockUserToken){const o=typeof i.mockUserToken=="string"?i.mockUserToken:bu(i.mockUserToken,n.app.options.projectId);r=new Tn(o)}eg(s,e,t,r)}/**
 * @license
 * Copyright 2021 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function ag(n){Qf(Ct),_t(new Ke("database",(e,{instanceIdentifier:t})=>{const i=e.getProvider("app").getImmediate(),s=e.getProvider("auth-internal"),r=e.getProvider("app-check-internal");return tg(i,s,r,t)},"PUBLIC").setMultipleInstances(!0)),Oe(Vr,qr,n),Oe(Vr,qr,"esm2017")}_e.prototype.simpleListen=function(n,e){this.sendRequest("q",{p:n},e)};_e.prototype.echo=function(n,e){this.sendRequest("echo",{d:n},e)};ag();const cg={apiKey:"AIzaSyC8h3URJ11rtYdCAvzpj_Jb2EeQlHqeI0s",authDomain:"pebble-v2.firebaseapp.com",databaseURL:"https://pebble-v2-default-rtdb.firebaseio.com",projectId:"pebble-v2",storageBucket:"pebble-v2.firebasestorage.app",messagingSenderId:"72431049145",appId:"1:72431049145:web:abc5fe13a006f24b07be68"};let gn=null,vn=null,kn=null,bo=null,Jc=!1;function lg(){return Jc}async function ug(){return gn=ea(cg),vn=Kf(gn),kn=rg(gn),J_(Qc(kn,".info/connected"),n=>{Jc=n.val()===!0}),await new Promise((n,e)=>{const t=Md(vn,i=>{i&&(bo=i.uid,t(),n())});Nd(vn).catch(e)}),{app:gn,auth:vn,db:kn,uid:bo}}async function hg(){const n=Object.keys(localStorage).filter(e=>e.startsWith("fb_pending:"));for(const e of n){const t=e.replace("fb_pending:",""),{value:i}=JSON.parse(localStorage.getItem(e));try{await Y_(Qc(kn,t),i),localStorage.removeItem(e)}catch{break}}}const dg="tinklepebble-v2",fg=1;let yn=null;const pg={spells:{keyPath:"id",autoIncrement:!0,indexes:["name","level","school","class"]},feats:{keyPath:"id",autoIncrement:!0,indexes:["name","prerequisite"]},glossary:{keyPath:"id",autoIncrement:!0,indexes:["term"]},classData:{keyPath:"id",autoIncrement:!0,indexes:["class","level"]},maneuvers:{keyPath:"id",autoIncrement:!0,indexes:["name"]},xpThresholds:{keyPath:"level",autoIncrement:!1,indexes:[]},compendium:{keyPath:"id",autoIncrement:!0,indexes:["name","type","source"]},meta:{keyPath:"key",autoIncrement:!1,indexes:[]}};function Ei(){return yn?Promise.resolve(yn):new Promise((n,e)=>{const t=indexedDB.open(dg,fg);t.onupgradeneeded=i=>{const s=i.target.result;for(const[r,o]of Object.entries(pg))if(!s.objectStoreNames.contains(r)){const a=s.createObjectStore(r,{keyPath:o.keyPath,autoIncrement:o.autoIncrement});for(const c of o.indexes)a.createIndex(c,c,{unique:!1})}},t.onsuccess=()=>{yn=t.result,n(yn)},t.onerror=()=>e(t.error)})}async function mg(){await Ei()}async function _g(){const n=await Ei();return new Promise(e=>{const i=n.transaction("meta","readonly").objectStore("meta").get("_seeded");i.onsuccess=()=>e(!!i.result),i.onerror=()=>e(!1)})}async function gg(){(await Ei()).transaction("meta","readwrite").objectStore("meta").put({key:"_seeded",value:!0,ts:Date.now()})}async function st(n,e){const i=(await Ei()).transaction(n,"readwrite"),s=i.objectStore(n);for(const r of e)s.put(r);return new Promise((r,o)=>{i.oncomplete=r,i.onerror=()=>o(i.error)})}const vg="modulepreload",yg=function(n){return"/v2/"+n},So={},be=function(e,t,i){let s=Promise.resolve();if(t&&t.length>0){document.getElementsByTagName("link");const o=document.querySelector("meta[property=csp-nonce]"),a=(o==null?void 0:o.nonce)||(o==null?void 0:o.getAttribute("nonce"));s=Promise.allSettled(t.map(c=>{if(c=yg(c),c in So)return;So[c]=!0;const l=c.endsWith(".css"),h=l?'[rel="stylesheet"]':"";if(document.querySelector(`link[href="${c}"]${h}`))return;const u=document.createElement("link");if(u.rel=l?"stylesheet":vg,l||(u.as="script"),u.crossOrigin="",u.href=c,a&&u.setAttribute("nonce",a),document.head.appendChild(u),l)return new Promise((d,f)=>{u.addEventListener("load",d),u.addEventListener("error",()=>f(new Error(`Unable to preload CSS for ${c}`)))})}))}function r(o){const a=new Event("vite:preloadError",{cancelable:!0});if(a.payload=o,window.dispatchEvent(a),!a.defaultPrevented)throw o}return s.then(o=>{for(const a of o||[])a.status==="rejected"&&r(a.reason);return e().catch(r)})};async function wg(){if(await _g())return;const[n,e,t,i,s,r,o,a]=await Promise.all([be(()=>import("./spells-Dft0rZD5.js"),[]).then(c=>c.default),be(()=>import("./feats-BLbLbjGs.js"),[]).then(c=>c.default),be(()=>import("./glossary-DZa2qMjD.js"),[]).then(c=>c.default),be(()=>import("./maneuvers-BLexn1ua.js"),[]).then(c=>c.default),be(()=>import("./xp-thresholds-KuuGt6Tj.js"),[]).then(c=>c.default),be(()=>import("./level-up-fighter-Dpu2dFwy.js"),[]).then(c=>c.default),be(()=>import("./level-up-rogue-SstTJMRK.js"),[]).then(c=>c.default),be(()=>import("./level-up-bard-C1GCrWj2.js"),[]).then(c=>c.default)]);await Promise.all([st("spells",n),st("feats",e),st("glossary",t),st("maneuvers",i),st("xpThresholds",s),st("classData",[...r,...o,...a])]),await gg()}async function Eg(){await Promise.all([ug(),mg()]),await wg(),lg()&&await hg()}const Ig=document.getElementById("app");Eg().then(()=>{fl(()=>X(pu,{}),Ig)});
