/* ============ STORAGE HELPERS ============ */
const DB = {
  get:(k,d)=>JSON.parse(localStorage.getItem(k))||d,
  set:(k,v)=>localStorage.setItem(k,JSON.stringify(v))
};
let users        = DB.get('eh_users',[]);
let session      = DB.get('eh_session',null);
let favorites    = DB.get('eh_favorites',{});      // {email:[ids]}
let registrations= DB.get('eh_registrations',{});  // {email:[{id,bookingId,seats,date,...}]}
let reviews      = DB.get('eh_reviews',{});        // {eventId:[{user,rating,text}]}
let recentViewed = DB.get('eh_recent',{});         // {email:[ids]}
let seatBookings = DB.get('eh_seats',{});          // {eventId:[seatNos]}

/* ============ SAMPLE EVENTS ============ */
const CATEGORIES = ["Technology","Music","Sports","Education","Business","Entertainment","Art & Culture"];
const CAT_ICON = {"Technology":"💻","Music":"🎵","Sports":"⚽","Education":"📚","Business":"💼","Entertainment":"🎭","Art & Culture":"🎨"};
const IMG = c=>`https://picsum.photos/seed/${encodeURIComponent(c)}/600/400`;

function futureDate(days){ const d=new Date(); d.setDate(d.getDate()+days); d.setHours(18,0,0,0); return d.toISOString(); }

const EVENTS = [
  {id:1,name:"Future Tech Summit",cat:"Technology",date:futureDate(5),venue:"Bangalore Convention Centre",address:"Hosur Rd, Bengaluru, KA",price:1499,seats:64,organizer:"TechWorld Inc",created:10,popularity:320},
  {id:2,name:"Sunburn Music Fest",cat:"Music",date:futureDate(12),venue:"Vagator Beach, Goa",address:"Vagator, Goa",price:2999,seats:64,organizer:"Sunburn Events",created:8,popularity:540},
  {id:3,name:"City Marathon 2026",cat:"Sports",date:futureDate(3),venue:"Marine Drive, Mumbai",address:"Marine Drive, Mumbai, MH",price:0,seats:64,organizer:"RunIndia",created:6,popularity:210},
  {id:4,name:"AI & ML Workshop",cat:"Education",date:futureDate(20),venue:"IIT Delhi Auditorium",address:"Hauz Khas, New Delhi",price:799,seats:64,organizer:"EduLearn",created:14,popularity:180},
  {id:5,name:"Startup Pitch Night",cat:"Business",date:futureDate(9),venue:"WeWork, Hyderabad",address:"Hitech City, Hyderabad",price:499,seats:64,organizer:"FoundersClub",created:4,popularity:260},
  {id:6,name:"Comedy Carnival",cat:"Entertainment",date:futureDate(2),venue:"Phoenix Mall, Pune",address:"Viman Nagar, Pune",price:699,seats:64,organizer:"LaughHouse",created:2,popularity:300},
  {id:7,name:"Modern Art Expo",cat:"Art & Culture",date:futureDate(16),venue:"National Gallery, Delhi",address:"Jaipur House, New Delhi",price:0,seats:64,organizer:"ArtCircle",created:11,popularity:140},
  {id:8,name:"Cloud DevCon",cat:"Technology",date:futureDate(25),venue:"HICC, Hyderabad",address:"Hitech City, Hyderabad",price:1999,seats:64,organizer:"CloudNet",created:1,popularity:230},
  {id:9,name:"Jazz Evening",cat:"Music",date:futureDate(7),venue:"Hard Rock Cafe, Mumbai",address:"Andheri, Mumbai",price:1200,seats:64,organizer:"BlueNotes",created:5,popularity:175},
  {id:10,name:"Premier League Screening",cat:"Sports",date:futureDate(1),venue:"Sports Bar, Bangalore",address:"Koramangala, Bengaluru",price:300,seats:64,organizer:"FanZone",created:3,popularity:190}
];

/* ============ AUTH ============ */
const $ = id=>document.getElementById(id);
const authScreen=$('authScreen'), app=$('app');

document.querySelectorAll('.toggle-pwd').forEach(t=>t.onclick=()=>{
  const inp=$(t.dataset.target); inp.type = inp.type==='password'?'text':'password';
});
$('goSignup').onclick=e=>{e.preventDefault();$('loginForm').classList.add('hidden');$('signupForm').classList.remove('hidden')};
$('goLogin').onclick=e=>{e.preventDefault();$('signupForm').classList.add('hidden');$('loginForm').classList.remove('hidden')};

const emailOk=e=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const setErr=(id,msg)=>$(id).textContent=msg;

$('signupForm').onsubmit=e=>{
  e.preventDefault();
  const name=$('signupName').value.trim(), email=$('signupEmail').value.trim(), pwd=$('signupPassword').value;
  let ok=true; ['signupNameErr','signupEmailErr','signupPasswordErr'].forEach(i=>setErr(i,''));
  if(name.length<3){setErr('signupNameErr','Name min 3 chars');ok=false}
  if(!emailOk(email)){setErr('signupEmailErr','Invalid email');ok=false}
  if(pwd.length<6){setErr('signupPasswordErr','Password min 6 chars');ok=false}
  if(users.some(u=>u.email===email)){setErr('signupEmailErr','Email already registered');ok=false}
  if(!ok)return;
  users.push({name,email,password:pwd}); DB.set('eh_users',users);
  startSession(email); toast('Account created! Welcome 🎉','success');
};

$('loginForm').onsubmit=e=>{
  e.preventDefault();
  const email=$('loginEmail').value.trim(), pwd=$('loginPassword').value;
  ['loginEmailErr','loginPasswordErr'].forEach(i=>setErr(i,''));
  if(!emailOk(email)){setErr('loginEmailErr','Invalid email');return}
  const u=users.find(u=>u.email===email);
  if(!u){setErr('loginEmailErr','No account found');return}
  if(u.password!==pwd){setErr('loginPasswordErr','Wrong password');return}
  startSession(email); toast('Login successful ✅','success');
};

function startSession(email){ session={email,since:Date.now()}; DB.set('eh_session',session); enterApp(); }
$('logoutBtn').onclick=()=>{ session=null; localStorage.removeItem('eh_session'); app.classList.add('hidden'); authScreen.classList.remove('hidden'); };

function currentUser(){ return users.find(u=>u.email===session.email); }

/* ============ ENTER APP ============ */
function enterApp(){
  authScreen.classList.add('hidden'); app.classList.remove('hidden');
  const u=currentUser();
  $('navUser').textContent='Hi, '+u.name.split(' ')[0];
  $('welcomeMsg').textContent=`Welcome back, ${u.name}! 👋`;
  ensureUserStores();
  renderEvents(); renderDashboard(); renderCalendar(); renderAnalytics(); renderBadges();
}
function ensureUserStores(){
  const e=session.email;
  if(!favorites[e])favorites[e]=[]; if(!registrations[e])registrations[e]=[]; if(!recentViewed[e])recentViewed[e]=[];
  saveAll();
}
function saveAll(){
  DB.set('eh_favorites',favorites);DB.set('eh_registrations',registrations);
  DB.set('eh_reviews',reviews);DB.set('eh_recent',recentViewed);DB.set('eh_seats',seatBookings);
}

/* ============ NAV ============ */
$('navLinks').onclick=e=>{
  if(e.target.dataset.page){
    document.querySelectorAll('.nav-links a').forEach(a=>a.classList.remove('active'));
    e.target.classList.add('active');
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    $(e.target.dataset.page).classList.add('active');
    $('navLinks').classList.remove('show');
    if(e.target.dataset.page==='analytics')renderAnalytics();
  }
};
$('burger').onclick=()=>$('navLinks').classList.toggle('show');

/* ============ THEME ============ */
const savedTheme=DB.get('eh_theme','light');
if(savedTheme==='dark'){document.documentElement.setAttribute('data-theme','dark');$('themeToggle').textContent='☀️';}
$('themeToggle').onclick=()=>{
  const dark=document.documentElement.getAttribute('data-theme')==='dark';
  document.documentElement.setAttribute('data-theme',dark?'light':'dark');
  $('themeToggle').textContent=dark?'🌙':'☀️';
  DB.set('eh_theme',dark?'light':'dark');
};

/* ============ TOAST ============ */
function toast(msg,type='info'){
  const t=document.createElement('div'); t.className='toast '+type; t.textContent=msg;
  $('toastBox').appendChild(t);
  setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),300)},2800);
}

/* ============ POPULATE FILTERS ============ */
const fc=$('filterCategory');
CATEGORIES.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=`${CAT_ICON[c]} ${c}`;fc.appendChild(o);});

/* ============ HELPERS ============ */
const isUpcoming=ev=>new Date(ev.date)>new Date();
const isFav=id=>favorites[session.email].includes(id);
const isReg=id=>registrations[session.email].some(r=>r.id===id);
const avgRating=id=>{const r=reviews[id]||[];return r.length?(r.reduce((a,b)=>a+b.rating,0)/r.length):0;};
const seatsLeft=ev=>ev.seats-((seatBookings[ev.id]||[]).length);
function fmtDate(iso){return new Date(iso).toLocaleString('en-IN',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'});}

/* ============ RENDER EVENTS ============ */
let countdownTimers=[];
function getFilteredEvents(){
  const q=$('searchInput').value.toLowerCase();
  const cat=$('filterCategory').value, price=$('filterPrice').value, up=$('filterUpcoming').value, sort=$('sortBy').value;
  let list=EVENTS.filter(ev=>{
    const match=ev.name.toLowerCase().includes(q)||ev.organizer.toLowerCase().includes(q)||ev.venue.toLowerCase().includes(q);
    const catOk=!cat||ev.cat===cat;
    const priceOk=!price||(price==='free'?ev.price===0:ev.price>0);
    const upOk=!up||isUpcoming(ev);
    return match&&catOk&&priceOk&&upOk;
  });
  const s={newest:(a,b)=>a.created-b.created,oldest:(a,b)=>b.created-a.created,
    priceHigh:(a,b)=>b.price-a.price,priceLow:(a,b)=>a.price-b.price,popular:(a,b)=>b.popularity-a.popularity};
  list.sort(s[sort]||s.newest);
  return list;
}
function eventCardHTML(ev){
  const left=seatsLeft(ev), rating=avgRating(ev.id), rc=(reviews[ev.id]||[]).length;
  return `<div class="event-card slide-up">
    <div class="event-banner">
      <img src="${IMG(ev.cat+ev.id)}" alt="${ev.name}">
      <span class="event-cat">${CAT_ICON[ev.cat]} ${ev.cat}</span>
      <button class="fav-btn ${isFav(ev.id)?'active':''}" data-fav="${ev.id}">❤</button>
    </div>
    <div class="event-body">
      <h3>${ev.name}</h3>
      <div class="event-meta">
        <span>📅 ${fmtDate(ev.date)}</span>
        <span>📍 ${ev.venue}</span>
        <span>👤 ${ev.organizer}</span>
        <span class="rating">⭐ ${rating.toFixed(1)} (${rc})</span>
      </div>
      <div class="countdown" data-cd="${ev.date}"></div>
      <div class="event-foot">
        <span class="price-tag">${ev.price===0?'FREE':'₹'+ev.price}</span>
        <span class="badge-seats">${left} seats left</span>
      </div>
      ${isReg(ev.id)?'<span class="status-reg">✔ Registered</span>':''}
      <div class="card-btns">
        <button class="btn-view" data-view="${ev.id}">View</button>
        <button class="btn-book" data-book="${ev.id}" ${left===0||isReg(ev.id)?'disabled':''}>${isReg(ev.id)?'Booked':'Book Now'}</button>
      </div>
    </div>
  </div>`;
}
function renderEvents(){
  $('eventGrid').innerHTML=getFilteredEvents().map(eventCardHTML).join('')||'<p class="muted">No events found.</p>';
  bindCards($('eventGrid')); startCountdowns();
}
['searchInput','filterCategory','filterPrice','filterUpcoming','sortBy'].forEach(id=>$(id).addEventListener('input',renderEvents));

function bindCards(scope){
  scope.querySelectorAll('[data-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();toggleFav(+b.dataset.fav)});
  scope.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>openDetail(+b.dataset.view));
  scope.querySelectorAll('[data-book]').forEach(b=>b.onclick=()=>openBooking(+b.dataset.book));
}

/* ============ COUNTDOWN ============ */
function startCountdowns(){
  countdownTimers.forEach(t=>clearInterval(t)); countdownTimers=[];
  document.querySelectorAll('[data-cd]').forEach(el=>{
    const target=new Date(el.dataset.cd).getTime();
    const tick=()=>{
      const diff=target-Date.now();
      if(diff<=0){el.innerHTML='<span class="cd-started">🔴 Event Started</span>';return;}
      const d=Math.floor(diff/864e5),h=Math.floor(diff%864e5/36e5),m=Math.floor(diff%36e5/6e4),s=Math.floor(diff%6e4/1e3);
      el.innerHTML=`<div><b>${d}</b>Days</div><div><b>${h}</b>Hrs</div><div><b>${m}</b>Min</div><div><b>${s}</b>Sec</div>`;
    };
    tick(); countdownTimers.push(setInterval(tick,1000));
  });
}

/* ============ FAVORITES ============ */
function toggleFav(id){
  const f=favorites[session.email];
  if(f.includes(id)){favorites[session.email]=f.filter(x=>x!==id);toast('Removed from favorites','info');}
  else{f.push(id);toast('Added to favorites ❤️','success');}
  saveAll(); renderEvents(); renderFavorites(); renderDashboard();
}
function renderFavorites(){
  const favs=EVENTS.filter(e=>isFav(e.id));
  $('favGrid').innerHTML=favs.map(eventCardHTML).join('')||'<p class="muted">No favorites yet. Add some ❤️</p>';
  bindCards($('favGrid')); startCountdowns();
}

/* ============ RECENTLY VIEWED ============ */
function trackView(id){
  let r=recentViewed[session.email].filter(x=>x!==id); r.unshift(id);
  recentViewed[session.email]=r.slice(0,6); saveAll();
}

/* ============ EVENT DETAIL + REVIEWS + MAP ============ */
let curRating=0;
function openDetail(id){
  const ev=EVENTS.find(e=>e.id===id); trackView(id);
  const left=seatsLeft(ev), revs=reviews[id]||[];
  curRating=0;
  $('detailContent').innerHTML=`
    <img class="detail-banner" src="${IMG(ev.cat+ev.id)}">
    <span class="event-cat" style="position:static;display:inline-block">${CAT_ICON[ev.cat]} ${ev.cat}</span>
    <h2 style="margin:8px 0">${ev.name}</h2>
    <div class="countdown" data-cd="${ev.date}"></div>
    <div class="detail-grid">
      <div>📅 <b>${fmtDate(ev.date)}</b></div>
      <div>📍 ${ev.venue}</div>
      <div>👤 ${ev.organizer}</div>
      <div>💰 ${ev.price===0?'FREE':'₹'+ev.price}</div>
      <div>🪑 ${left} seats available</div>
      <div>${isReg(ev.id)?'✔ Registered':'❌ Not Registered'}</div>
    </div>
    <p class="muted">A wonderful ${ev.cat} event organized by ${ev.organizer}. Don't miss the experience at ${ev.venue}!</p>

    <div class="location-card">
      <h3>🗺 Location</h3>
      <p>${ev.venue}<br><span class="muted">${ev.address}</span></p>
      <iframe class="map-frame" src="https://maps.google.com/maps?q=${encodeURIComponent(ev.address)}&output=embed"></iframe>
    </div>

    <div class="review-box">
      <h3>⭐ Reviews (${revs.length}) — Avg ${avgRating(id).toFixed(1)}</h3>
      <div class="star-input" id="starInput">${[1,2,3,4,5].map(n=>`<span data-star="${n}">★</span>`).join('')}</div>
      <textarea id="reviewText" placeholder="Write a review..." style="width:100%;padding:10px;border-radius:10px;margin:8px 0;border:1px solid var(--glass-brd);background:var(--card);color:var(--text)"></textarea>
      <button class="btn-primary" id="submitReview">Submit Review</button>
      <div id="reviewList">${revs.map(r=>`<div class="review-item"><b>${r.user} — ${'★'.repeat(r.rating)}</b>${r.text||''}</div>`).join('')}</div>
    </div>
    <button class="btn-primary" style="margin-top:14px" data-book="${ev.id}" ${left===0||isReg(ev.id)?'disabled':''}>${isReg(ev.id)?'Already Booked':'Book Now'}</button>`;

  $('detailContent').querySelector('[data-book]').onclick=()=>{closeModals();openBooking(id);};
  document.querySelectorAll('#starInput span').forEach(s=>{
    s.onmouseover=()=>paintStars(+s.dataset.star);
    s.onclick=()=>{curRating=+s.dataset.star;paintStars(curRating);};
  });
  $('submitReview').onclick=()=>{
    if(!curRating){toast('Pick a rating','error');return;}
    if(!reviews[id])reviews[id]=[];
    reviews[id].push({user:currentUser().name,rating:curRating,text:$('reviewText').value.trim()});
    saveAll(); toast('Review added ⭐','success'); openDetail(id); renderEvents();
  };
  openModal('detailModal'); startCountdowns(); renderDashboard();
}
function paintStars(n){document.querySelectorAll('#starInput span').forEach((s,i)=>s.classList.toggle('on',i<n));}

/* ============ BOOKING + SEAT SELECTION ============ */
let bookingState={id:null,seats:[]};
function openBooking(id){
  const ev=EVENTS.find(e=>e.id===id);
  if(isReg(id)){toast('Already registered for this event','error');return;}
  bookingState={id,seats:[]};
  $('bookEventName').textContent=ev.name;
  const booked=seatBookings[id]||[];
  $('bookSeatInfo').textContent=`${ev.seats-booked.length} of ${ev.seats} seats available`;
  $('perPrice').textContent='₹'+ev.price;
  let html='';
  for(let i=1;i<=ev.seats;i++){
    const b=booked.includes(i);
    html+=`<button class="seat ${b?'booked':''}" data-seat="${i}" ${b?'disabled':''}>${i}</button>`;
  }
  $('seatMap').innerHTML=html;
  $('seatMap').querySelectorAll('.seat:not(.booked)').forEach(s=>s.onclick=()=>{
    const no=+s.dataset.seat;
    if(bookingState.seats.includes(no)){bookingState.seats=bookingState.seats.filter(x=>x!==no);s.classList.remove('selected');}
    else{bookingState.seats.push(no);s.classList.add('selected');}
    updateBookingSummary(ev);
  });
  updateBookingSummary(ev);
  openModal('bookingModal');
}
function updateBookingSummary(ev){
  const n=bookingState.seats.length;
  $('selSeats').textContent=n;
  $('totalPrice').textContent='₹'+(n*ev.price);
  $('proceedPay').disabled=n===0;
}
$('proceedPay').onclick=()=>{
  const ev=EVENTS.find(e=>e.id===bookingState.id);
  closeModals();
  $('orderSummary').innerHTML=`
    <div class="ticket-row" style="color:var(--text)"><span>Event</span><b>${ev.name}</b></div>
    <div class="ticket-row" style="color:var(--text)"><span>Seats</span><b>${bookingState.seats.join(', ')}</b></div>
    <div class="ticket-row" style="color:var(--text)"><span>Qty</span><b>${bookingState.seats.length}</b></div>
    <div class="ticket-row" style="color:var(--text)"><span>Total</span><b>₹${bookingState.seats.length*ev.price}</b></div>`;
  openModal('paymentModal');
};

/* ============ PAYMENT + TICKET ============ */
$('payNow').onclick=()=>{
  const ev=EVENTS.find(e=>e.id===bookingState.id);
  const method=document.querySelector('input[name="pay"]:checked').value;
  // save seats
  if(!seatBookings[ev.id])seatBookings[ev.id]=[];
  seatBookings[ev.id].push(...bookingState.seats);
  ev.popularity+=bookingState.seats.length;
  const bookingId='EVT-'+Date.now().toString(36).toUpperCase();
  registrations[session.email].push({
    id:ev.id,name:ev.name,bookingId,seats:bookingState.seats,
    date:new Date().toISOString(),price:bookingState.seats.length*ev.price,method,eventDate:ev.date
  });
  saveAll();
  toast(`Payment successful via ${method} 💳`,'success');
  toast('Booking confirmed 🎟','success');
  closeModals(); showTicket(ev,bookingId);
  renderEvents(); renderDashboard(); renderAnalytics(); renderBadges();
};
function showTicket(ev,bookingId){
  const u=currentUser();
  $('ticket').innerHTML=`
    <h3>🎫 ${ev.name}</h3>
    <div class="ticket-row"><span>Name</span><b>${u.name}</b></div>
    <div class="ticket-row"><span>Booking ID</span><b>${bookingId}</b></div>
    <div class="ticket-row"><span>Seats</span><b>${bookingState.seats.join(', ')}</b></div>
    <div class="ticket-row"><span>Date</span><b>${fmtDate(ev.date)}</b></div>
    <div class="ticket-row"><span>Venue</span><b>${ev.venue}</b></div>
    <div class="qr"></div>`;
  $('downloadTicket').onclick=()=>downloadTicket(ev,bookingId,u);
  openModal('ticketModal');
}
function downloadTicket(ev,bookingId,u){
  const txt=`EVENTHUB TICKET\n================\nEvent: ${ev.name}\nName: ${u.name}\nBooking ID: ${bookingId}\nSeats: ${bookingState.seats.join(', ')}\nDate: ${fmtDate(ev.date)}\nVenue: ${ev.venue}\n================\nShow this at entry.`;
  const blob=new Blob([txt],{type:'text/plain'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`Ticket_${bookingId}.txt`;a.click();
  toast('Ticket downloaded ⬇','success');
}

/* ============ MODAL CONTROL ============ */
function openModal(id){$(id).classList.add('open');}
function closeModals(){document.querySelectorAll('.modal').forEach(m=>m.classList.remove('open'));}
document.querySelectorAll('.close-modal').forEach(b=>b.onclick=closeModals);
document.querySelectorAll('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)closeModals();});

/* ============ DASHBOARD ============ */
function renderDashboard(){
  const regs=registrations[session.email], favs=favorites[session.email];
  $('statTotal').textContent=EVENTS.length;
  $('statReg').textContent=regs.length;
  $('statFav').textContent=favs.length;
  $('statUp').textContent=EVENTS.filter(isUpcoming).length;

  // recent activity
  const acts=[];
  regs.slice(-3).reverse().forEach(r=>acts.push(`🎟 Registered for <b>${r.name}</b> (${r.bookingId})`));
  favs.slice(-3).reverse().forEach(id=>{const e=EVENTS.find(x=>x.id===id);if(e)acts.push(`❤️ Favorited <b>${e.name}</b>`);});
  $('recentActivity').innerHTML=acts.length?acts.map(a=>`<li>${a}</li>`).join(''):'<li class="muted">No activity yet.</li>';

  // recommendations
  $('recommendations').innerHTML=getRecommendations().map(recoHTML).join('')||'<p class="muted">Interact with events for recommendations.</p>';
  // recently viewed
  $('recentlyViewed').innerHTML=recentViewed[session.email].map(id=>{const e=EVENTS.find(x=>x.id===id);return e?recoHTML(e):'';}).join('')||'<p class="muted">No recently viewed events.</p>';
  bindReco();
}
function recoHTML(ev){return `<div class="reco-card" data-reco="${ev.id}"><img src="${IMG(ev.cat+ev.id)}"><div>${ev.name}</div></div>`;}
function bindReco(){document.querySelectorAll('[data-reco]').forEach(c=>c.onclick=()=>openDetail(+c.dataset.reco));}

function getRecommendations(){
  const regs=registrations[session.email], favs=favorites[session.email], rv=recentViewed[session.email];
  const likedCats={};
  [...regs.map(r=>r.id),...favs,...rv].forEach(id=>{const e=EVENTS.find(x=>x.id===id);if(e)likedCats[e.cat]=(likedCats[e.cat]||0)+1;});
  const interacted=new Set([...regs.map(r=>r.id),...favs]);
  const topCats=Object.keys(likedCats).sort((a,b)=>likedCats[b]-likedCats[a]);
  let recs=EVENTS.filter(e=>topCats.includes(e.cat)&&!interacted.has(e.id));
  if(recs.length<4)recs=[...recs,...EVENTS.filter(e=>!interacted.has(e.id)&&!recs.includes(e))];
  return recs.slice(0,4);
}

/* ============ CALENDAR ============ */
let calDate=new Date();
function renderCalendar(){
  const y=calDate.getFullYear(),m=calDate.getMonth();
  $('calTitle').textContent=calDate.toLocaleString('en-IN',{month:'long',year:'numeric'});
  const first=new Date(y,m,1).getDay(), days=new Date(y,m+1,0).getDate();
  const today=new Date();
  const eventDays={};
  EVENTS.forEach(e=>{const d=new Date(e.date);if(d.getFullYear()===y&&d.getMonth()===m)(eventDays[d.getDate()]=eventDays[d.getDate()]||[]).push(e);});
  let html=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>`<div class="cal-cell head">${d}</div>`).join('');
  for(let i=0;i<first;i++)html+='<div class="cal-cell empty"></div>';
  for(let d=1;d<=days;d++){
    const has=eventDays[d], isToday=today.getFullYear()===y&&today.getMonth()===m&&today.getDate()===d;
    html+=`<div class="cal-cell ${has?'has-event':''} ${isToday?'today':''}" data-day="${d}">${d}${has?'<span class="cal-dot"></span>':''}</div>`;
  }
  $('calGrid').innerHTML=html;
  $('calGrid').querySelectorAll('[data-day]').forEach(c=>c.onclick=()=>{
    const evs=eventDays[+c.dataset.day]||[];
    $('calDayTitle').textContent=`Events on ${c.dataset.day} ${calDate.toLocaleString('en-IN',{month:'short'})}`;
    $('calDayEvents').innerHTML=evs.map(eventCardHTML).join('')||'<p class="muted">No events on this day.</p>';
    bindCards($('calDayEvents')); startCountdowns();
  });
}
$('prevMonth').onclick=()=>{calDate.setMonth(calDate.getMonth()-1);renderCalendar();};
$('nextMonth').onclick=()=>{calDate.setMonth(calDate.getMonth()+1);renderCalendar();};

/* ============ ANALYTICS (Canvas) ============ */
function renderAnalytics(){
  const regs=registrations[session.email], favs=favorites[session.email];
  $('anTotal').textContent=EVENTS.length;
  $('anReg').textContent=regs.length;
  $('anFav').textContent=favs.length;
  $('anUp').textContent=EVENTS.filter(isUpcoming).length;

  // category counts of registered
  const catCount={};
  regs.forEach(r=>{const e=EVENTS.find(x=>x.id===r.id);if(e)catCount[e.cat]=(catCount[e.cat]||0)+1;});
  const topCat=Object.keys(catCount).sort((a,b)=>catCount[b]-catCount[a])[0];
  $('anPop').textContent=topCat?CAT_ICON[topCat]+' '+topCat:'-';

  // this month registrations
  const now=new Date();
  $('anMonth').textContent=regs.filter(r=>{const d=new Date(r.date);return d.getMonth()===now.getMonth()&&d.getFullYear()===now.getFullYear();}).length;

  drawTrend(regs); drawBar(catCount); drawPie(catCount);
}
function drawTrend(regs){
  const c=$('trendChart'),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
  // last 6 months
  const labels=[],data=[];const now=new Date();
  for(let i=5;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    labels.push(d.toLocaleString('en',{month:'short'}));
    data.push(regs.filter(r=>{const rd=new Date(r.date);return rd.getMonth()===d.getMonth()&&rd.getFullYear()===d.getFullYear();}).length);}
  const max=Math.max(...data,1),pad=30,w=c.width-pad*2,h=c.height-pad*2;
  ctx.strokeStyle='#6d5efc';ctx.lineWidth=2;ctx.beginPath();
  data.forEach((v,i)=>{const x=pad+i*(w/5),y=pad+h-(v/max*h);i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
  ctx.stroke();
  ctx.fillStyle='#6d5efc';ctx.font='11px sans-serif';
  data.forEach((v,i)=>{const x=pad+i*(w/5),y=pad+h-(v/max*h);ctx.beginPath();ctx.arc(x,y,4,0,7);ctx.fill();
    ctx.fillStyle=getComputedStyle(document.body).color;ctx.fillText(labels[i],x-10,c.height-8);ctx.fillStyle='#6d5efc';});
}
function drawBar(catCount){
  const c=$('barChart'),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
  const cats=CATEGORIES,vals=cats.map(ct=>catCount[ct]||0),max=Math.max(...vals,1);
  const pad=30,w=c.width-pad*2,h=c.height-pad*2,bw=w/cats.length*0.6;
  const colors=['#6d5efc','#9b5efc','#2ecc71','#f1c40f','#e74c3c','#1abc9c','#e67e22'];
  cats.forEach((ct,i)=>{const x=pad+i*(w/cats.length),bh=vals[i]/max*h;
    ctx.fillStyle=colors[i];ctx.fillRect(x,pad+h-bh,bw,bh);
    ctx.fillStyle=getComputedStyle(document.body).color;ctx.font='9px sans-serif';
    ctx.fillText(ct.slice(0,4),x,c.height-8);ctx.fillText(vals[i],x+bw/3,pad+h-bh-4);});
}
function drawPie(catCount){
  const c=$('pieChart'),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);
  const entries=Object.entries(catCount);
  const total=entries.reduce((a,[,v])=>a+v,0);
  const cx=c.width/2,cy=c.height/2,r=80;
  const colors=['#6d5efc','#9b5efc','#2ecc71','#f1c40f','#e74c3c','#1abc9c','#e67e22'];
  if(!total){ctx.fillStyle='#888';ctx.font='13px sans-serif';ctx.fillText('No registrations yet',cx-60,cy);return;}
  let start=-Math.PI/2;
  entries.forEach(([ct,v],i)=>{const slice=v/total*Math.PI*2;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,start,start+slice);ctx.closePath();
    ctx.fillStyle=colors[i%colors.length];ctx.fill();
    const mid=start+slice/2;ctx.fillStyle=getComputedStyle(document.body).color;ctx.font='10px sans-serif';
    ctx.fillText(ct.slice(0,4),cx+Math.cos(mid)*(r+14)-10,cy+Math.sin(mid)*(r+14));
    start+=slice;});
}

/* ============ GAMIFICATION ============ */
const BADGES=[
  {ico:'🥉',name:'First Registration',desc:'Register for your first event',check:r=>r.length>=1},
  {ico:'🥈',name:'Event Explorer',desc:'Register for 3 events',check:r=>r.length>=3},
  {ico:'🥇',name:'Top Attendee',desc:'Register for 5 events',check:r=>r.length>=5},
];
function renderBadges(){
  const regs=registrations[session.email];
  $('badgeGrid').innerHTML=BADGES.map(b=>{
    const unlocked=b.check(regs);
    return `<div class="badge-card ${unlocked?'':'locked'}">
      <div class="b-ico">${b.ico}</div><h3>${b.name}</h3><p class="muted">${b.desc}</p>
      <p style="margin-top:8px;font-weight:600;color:${unlocked?'var(--green)':'var(--muted)'}">${unlocked?'✔ Unlocked':'🔒 Locked'}</p>
    </div>`;
  }).join('');
}

/* ============ AUTO LOGIN ============ */
if(session && users.some(u=>u.email===session.email)){ enterApp(); }
