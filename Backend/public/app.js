const routesApi = {
  salles: '/api/salles',
  services: '/api/services',
  evenements: '/api/evenements'
}

// Helpers
const getElem = (id) => document.getElementById(id)
const selecteur = (s) => document.querySelector(s)

// Onglets
document.getElementById('tab-salles').onclick = () => afficherOnglet('salles')
document.getElementById('tab-services').onclick = () => afficherOnglet('services')
document.getElementById('tab-evenements').onclick = () => afficherOnglet('evenements')
function afficherOnglet(id){
  document.querySelectorAll('.tab').forEach(t=>t.style.display='none')
  getElem(id).style.display='block'
  if(id==='salles') recupererSalles()
  if(id==='services') recupererServices()
  if(id==='evenements') { recupererEvenements(); remplirSalles(); remplirServices(); }
}

// = Salles =
async function recupererSalles(){
  const reponse = await fetch(routesApi.salles)
  const donnees = await reponse.json()
  const conteneur = getElem('liste-salles')
  conteneur.innerHTML = ''
  donnees.forEach(salle=>{
    const carte = document.createElement('div'); carte.className='card'
    carte.innerHTML = `<strong>${salle.nom_salle}</strong> · ${salle.capacite} pers<br>${salle.equipements || ''}`
    const actions = document.createElement('div'); actions.className='actions'
    const btnModifier = document.createElement('button'); btnModifier.textContent='Modifier';
    btnModifier.onclick=()=> remplirFormulaireSalle(salle)
    const btnSupprimer = document.createElement('button'); btnSupprimer.textContent='Supprimer';
    btnSupprimer.onclick=()=> supprimerSalle(salle.id_salle)
    actions.append(btnModifier,btnSupprimer); carte.appendChild(actions); conteneur.appendChild(carte)
  })
}

function remplirFormulaireSalle(s){
  getElem('salle-id').value = s.id_salle
  getElem('salle-nom').value = s.nom_salle
  getElem('salle-capacite').value = s.capacite || ''
  getElem('salle-equipements').value = s.equipements || ''
  getElem('salle-statut').value = s.statut || 'disponible'
}

getElem('form-salle').onsubmit = async (e)=>{
  e.preventDefault()
  const id = getElem('salle-id').value
  const corps = {
    nom_salle: getElem('salle-nom').value,
    capacite: Number(getElem('salle-capacite').value)||0,
    equipements: getElem('salle-equipements').value,
    statut: getElem('salle-statut').value
  }
  if(id){
    await fetch(`${routesApi.salles}/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(corps)})
  } else {
    await fetch(routesApi.salles,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(corps)})
  }
  reinitialiserFormulaireSalle()
  recupererSalles()
}

getElem('salle-reset').onclick = reinitialiserFormulaireSalle
function reinitialiserFormulaireSalle(){ getElem('salle-id').value=''; getElem('form-salle').reset() }

async function supprimerSalle(id){ if(!confirm('Supprimer ?'))return; await fetch(`${routesApi.salles}/${id}`,{method:'DELETE'}); recupererSalles() }

// = Services =

async function recupererServices(){
  const reponse = await fetch(routesApi.services)
  const donnees = await reponse.json()
  const conteneur = getElem('liste-services'); conteneur.innerHTML=''
  donnees.forEach(service=>{
    const carte = document.createElement('div'); carte.className='card'
    carte.innerHTML = `<strong>${service.nom_service}</strong> · ${service.tarif} €<br>${service.description||''}`
    const btnModifier = document.createElement('button'); btnModifier.textContent='Modifier'; btnModifier.onclick=()=> remplirFormulaireService(service)
    const btnSupprimer = document.createElement('button'); btnSupprimer.textContent='Supprimer'; btnSupprimer.onclick=()=> supprimerService(service.id_service)
    const actions = document.createElement('div'); actions.className='actions'; actions.append(btnModifier,btnSupprimer); carte.appendChild(actions)
    conteneur.appendChild(carte)
  })
}

function remplirFormulaireService(s){ getElem('service-id').value=s.id_service; getElem('service-nom').value=s.nom_service; getElem('service-desc').value=s.description || ''; getElem('service-tarif').value=s.tarif }


getElem('form-service').onsubmit = async (e)=>{
  e.preventDefault()
  const id = getElem('service-id').value
  const corps = { nom_service:getElem('service-nom').value, description:getElem('service-desc').value, tarif: Number(getElem('service-tarif').value)||0 }
  if(id){ await fetch(`${routesApi.services}/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(corps)}) }
  else{ await fetch(routesApi.services,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(corps)}) }
  getElem('form-service').reset(); recupererServices()
}

getElem('service-reset').onclick = ()=>{getElem('service-id').value=''; getElem('form-service').reset()}
async function supprimerService(id){ if(!confirm('Supprimer ?'))return; await fetch(`${routesApi.services}/${id}`,{method:'DELETE'}); recupererServices(); remplirServices() }

// = Evénements =

async function recupererEvenements(){
  const reponse = await fetch(routesApi.evenements)
  const donnees = await reponse.json()
  const conteneur = getElem('liste-evenements'); conteneur.innerHTML=''
  donnees.forEach(ev=>{
    const carte = document.createElement('div'); carte.className='card'
    carte.innerHTML = `<strong>${ev.nom_evenement}</strong> (${ev.type_evenement||''})<br>${ev.date_debut} → ${ev.date_fin}<br>Salle: ${ev.id_salle}`
    conteneur.appendChild(carte)
  })
}

async function remplirSalles(){
  const reponse = await fetch(routesApi.salles); const donnees = await reponse.json()
  const sel = getElem('evt-salle'); sel.innerHTML=''
  donnees.forEach(s=>{ const o=document.createElement('option'); o.value=s.id_salle; o.textContent=s.nom_salle; sel.appendChild(o) })
}

async function remplirServices(){
  const reponse = await fetch(routesApi.services); const donnees = await reponse.json()
  const sel = getElem('evt-services'); sel.innerHTML=''
  donnees.forEach(s=>{ const o=document.createElement('option'); o.value=s.id_service; o.textContent=`${s.nom_service} (${s.tarif}€)`; sel.appendChild(o) })
}


getElem('form-evenement').onsubmit = async (e)=>{
  e.preventDefault()
  const services = Array.from(getElem('evt-services').selectedOptions).map(o=>Number(o.value))
  const corps = {
    nom_evenement: getElem('evt-nom').value,
    type_evenement: getElem('evt-type').value,
    description: getElem('evt-desc').value,
    date_debut: getElem('evt-debut').value,
    date_fin: getElem('evt-fin').value,
    statut: 'prévu',
    id_salle: Number(getElem('evt-salle').value),
    id_organisateur: Number(getElem('evt-organisateur').value),
    services
  }
  const reponse = await fetch(routesApi.evenements,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(corps)})
  if(reponse.status===201){ alert('Événement créé'); getElem('form-evenement').reset(); recupererEvenements() }
  else{ const ebody=await reponse.json(); alert('Erreur: '+(ebody.message||reponse.status)) }
}

// Init
afficherOnglet('salles')
