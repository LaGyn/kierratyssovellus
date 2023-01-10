import 'https://cdn.interactjs.io/v1.9.20/auto-start/index.js';
import 'https://cdn.interactjs.io/v1.9.20/actions/drag/index.js';
import 'https://cdn.interactjs.io/v1.9.20/actions/resize/index.js';
import 'https://cdn.interactjs.io/v1.9.20/modifiers/index.js';
import 'https://cdn.interactjs.io/v1.9.20/dev-tools/index.js';
import interact from 'https://cdn.interactjs.io/v1.9.20/interactjs/index.js';
let eng;
let fin;

//hakee json tiedostot ja sen jälkeen suorittaa init function
fetch("./lang/eng.json")
	.then((res) => res.json())
	.then((data) => {
		eng = data;
		fetch("./lang/fin.json")
			.then((res) => res.json())
			.then((data) => {
				fin = data;
				init();
			});
	});

// Globaalit muuttujat:
let roskienMaara = 10;
let target;
let relatedTarget;
let loaded = false;
let pisteElementti;
let pelaaUudestaan;
let mobile;
let data;
let ala;
let arvotutRoskat = [];
let roskat = "";
let roskienTyypit = [];
let luku = 0;
let binElements = "";
let trashList = [];

// Käynnistäessä:
function init() {
	data = fin; // Defaultina suomi
	ala = fin.alat[0];
	createNavbar();
}

// Drag and drop -toiminnot:
// Elements with class "draggable" are draggable
interact('.draggable').draggable({
	//keep the element within the area of it's parent
	modifiers: [
		interact.modifiers.restrict({
			restriction: '#game',
			endOnly: true
		})
	],
	listeners: {
		// call this function on every dragmove event
		move: dragMoveListener,
	}
});

// Elements with class "dropzone" can have elements dropped into them
interact(`.dropzone`).dropzone({
		overlap: "pointer",

		//ondrop run this function
		ondrop: function(event) {
			target = document.getElementById(event.target.id); // Target = roskis
			relatedTarget = document.getElementById(event.relatedTarget.id); // Related target = roska
			event.relatedTarget.style.display = "none"; // Roska häviää kun pudotettu roskikseen

			//jos on mobiili laite luo aina uuden roskan kun vanha lajitellaan
			if (mobile && roskienMaara > 1) {
				roskat = createTrashElement(trashList[roskienMaara - 2]);
				document.getElementById("roskat").innerHTML = roskat;
			}

			roskienMaara -= 1; // Roskien määrä vähenee pudotettaessa
			givePoints(); // Laskee pisteet

			//kun kaikki roskat on lajiteltu suorittaa tämän
			if (roskienMaara === 0) {
				let otsikko = document.getElementById('otsikko');
				otsikko.style.display = 'none'; // Piilottaa "ohjeistavan"otsikon
				pisteElementti = document.createElement('h1'); // Luo otsikon saaduille pisteille
				let text = data.text[0].html; // Haettava teksti otsikolle fin/eng
				let newText = document.createTextNode(text[4].value1 + pisteet + text[4].value2); // Luodaan teksti otsikolle
				let nappiText = document.createTextNode(text[5].value); // Uudestaan-napin teksti

				pisteElementti.appendChild(newText); // Lisätään luotu teksti pisteotsikko-elementtiin
				pisteElementti.id = 'pisteOtsikko';
				pisteElementti.className = 'pisteet';
				document.querySelector('header').appendChild(pisteElementti); // Lisätään elementti html-elementtiin 'header'
				pelaaUudestaan = document.createElement('button'); // Luodaan nappielementti
				pelaaUudestaan.appendChild(nappiText); // Lisätään teksti nappiin
				pelaaUudestaan.id = 'uusinta';
				pelaaUudestaan.className = 'uusintaNappi';
				pelaaUudestaan.addEventListener('click', uudestaan); // Lisätään klikkaus eventlistener napille, joka kutsuu uudestaan funktiota
				document.querySelector('header').appendChild(pelaaUudestaan); // Lisätään nappi html-elementtiin 'header'
			}
		}
	})
	.on('dropactivate', function(event) {
		event.target.classList.add('drop-activated');
	});

//handles moving 
function dragMoveListener(event) {
	var target = event.target;
	// keep the dragged position in the data-x/data-y attributes
	var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
	var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

	// translate the element
	target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';

	// update the position attributes
	target.setAttribute('data-x', x);
	target.setAttribute('data-y', y);
}

// Laskee pisteet:
let pisteet = 0;

function givePoints() {
	relatedTarget = ala.trash[relatedTarget.id - 1]; // Haetaan roska arraysta
	if (relatedTarget.type == target.id) { // Jos roskan tyyppi on sama kuin roskiksen, lisää pisteen
		pisteet++;
	}
}

// Luo navbarin:
function createNavbar() {
	let alat = data.alat; // alat valitulla kielellä
	let navlist = document.getElementById('lista'); // = ul-elementti

	for (let i = 0; i < alat.length; i++) { // Käy läpi kaikki alat
		let pElement = document.createElement('p'); // = ul-elementin p-elementit
		let pText = document.createTextNode(alat[i].info[0].name); // Teksti pElementtiin: jokaisen alan nimi
		pElement.appendChild(pText); // Lisätään teksti pElementtiin
		pElement.className = 'nav-link'; // Annetaan elementille class
		pElement.value = alat[i].info[0].id; // Määritellään elementille value joka on alan id nro
		let liElement = document.createElement('li'); // Luodaan listaelementti
		liElement.className = 'nav-item';
		liElement.className = 'setAla';

		liElement.appendChild(pElement); // Lisätään lista elementtiin pElement
		navlist.appendChild(liElement); // Lisätään ul-elementiin liElement
		pElement.addEventListener('click', closeNavbar); // Lisätään pElementiin eventlistener, joka klikkauksella sulkee dropdownin mobiilissa
		liElement.addEventListener('click', setAla); // EventListener, klikkauksella kutsutaan setAla
	}
}

// Pelin aloitus:

export function aloita() {
	if (!loaded) {
		loaded = true;
		mobile = window.matchMedia("(max-width: 700px)").matches; // Tarkistetaan laitteen koko

		for (let i = 0; i < roskienMaara; i++) { // Luodaan tietty määrä roskia
			createTrash();
		}

		//jos ei ole mobiili laite niin luo kaikki roska elementit kerrallaan
		//jos on niin luo vain yhden elementin
		if (!mobile) {
			for (let i = 0; i < trashList.length; i++) {
				roskat += createTrashElement(trashList[i]);
			}
		} else {
			roskat = createTrashElement(trashList[roskienMaara - 1]);
		}

		document.getElementById("start-menu").style.display = "none"; // Piilottaa aloitus ikkunan
		document.querySelectorAll(".game").forEach(a => a.style.display = "block"); // Näyttää peli-ikkunan
		document.getElementById('ala').innerHTML = ala.info[0].name; // Tulostaa valitun alan otsikon peliin
		document.getElementById("roskat").innerHTML = roskat; // Tulostaa roskan/roskat

		//luo roskikset
		fillArray();
		createTrashBins();
	}
}

//Creates an recyclable trash
function createTrash() {
	luku = Math.floor((Math.random() * [ala.trash.length])); // Arpoo valitun alan roskat

	//if the trash was chosen already
	if (arvotutRoskat.includes(luku)) {
		createTrash();
		return;
	}

	//if the chosen trash type has not already been added
	if (!roskienTyypit.includes(ala.trash[luku].type)) {
		//if there is already 8 types in array, if not add it to the array
		if (roskienTyypit.length >= 8) {
			createTrash();
			return;
		} else {
			roskienTyypit.push(ala.trash[luku].type);
		}
	}

	//lisää elementin ja lisää roskan arvottuihin roskiin
	trashList.push(ala.trash[luku]);
	arvotutRoskat.push(luku);
}

//creates an trash element
function createTrashElement(trash) {
	return `<div class="draggable" id=${trash.id}><p class="text-center mb-0">${trash.name}</p></div>`;
}

// Luo aina 8 roskista:
function fillArray() {
	while (roskienTyypit.length < 8) {
		let x = Math.floor((Math.random() * [data.bins.length]));

		if (!roskienTyypit.includes(data.bins[x].type)) {
			let y = Math.floor((Math.random() * [roskienTyypit.length]));
			roskienTyypit.splice(y, 0, data.bins[x].type);
		}
	}
}

// Lisää tarvittavat roskikset:
function createTrashBins() {
	let bins = data.bins;

	//loops through every bin for every type of trash
	for (let i = 0; i < roskienTyypit.length; i++) {
		for (let idx = 0; idx < bins.length; idx++) {
			if (roskienTyypit[i] == bins[idx].type) { // Jos roskiksen tyyppi ja roskan tyyppi on sama, tulostetaan ko. tyypin roskis
				binElements += `
        <div class="col-md">
          <div class="dropzone" id="${bins[idx].type}"> 
            <img src="${bins[idx].img}" id="roskis" alt="${bins[idx].name}">
            <h4 class="mb-3" id="roskis${idx}">${bins[idx].name}</h4>
          </div>
        </div>`;
				break;
			}
		}
		document.getElementById("bins").innerHTML = binElements;
	}
}

// Kielenvaihto toiminnot:

// Vaihtaa kielen roskiin, roskiksiin ja otsikoihin:
export function changeLang() {
	setLang();
	navbarLang();
	ala = data.alat[valittuAla];

	document.querySelectorAll(".draggable").forEach(item => { // Käydään valitut elementit (roskat) läpi ja tulostetaan niille roskan nimi valitulla kielellä
		item.innerHTML = ala.trash[item.id - 1].name;
	});

	for (let i = 0; i < data.bins.length; i++) { // Vaihdetaan roskiksiin kieli
		if (document.getElementById(`roskis${i}`)) {
			document.getElementById(`roskis${i}`).innerHTML = data.bins[i].name;
		}
	}
	let text = data.text[0];

	document.getElementById("aloita").innerHTML = `<span style="font-weight:bold;">${text.html[0].value}</span>`;
	document.getElementById("menu-lang").innerHTML = text.html[1].value;
	document.getElementById("flag").value = text.values[0].lang;
	document.getElementById("flag").src = text.values[0].flag;
	document.getElementById("otsikko").innerHTML = text.html[2].value;
	document.getElementById("footer").innerHTML = text.html[3].value;
	document.getElementById("ala").innerHTML = ala.info[0].name;
}

// Kielen valinta: 
function setLang() {
	let valittuLang = document.getElementById("flag").value; // Lipun arvo htmlssä
	if (valittuLang == "fin") { // Jos lipun arvo on fin, klikattaessa se muuttuu eng jne.
		data = eng;
	} else if (valittuLang == "eng") {
		data = fin;
	}
}

// Vaihtaa kielen navbariin: 
function navbarLang() {
	let navlist = document.getElementById('lista'); // = ul-elementti
	let pElement = navlist.querySelectorAll('p'); // = ul-elementin p-elementit
	for (let i = 0; i < data.alat.length; i++) { // Käy alat arrayn läpi ja vaihtaa jokaiseen tekstin toisella kielellä
		pElement[i].innerHTML = data.alat[i].info[0].name;
	}
}

// Alan valinta:
let valittuAla = 0;

function setAla(a) { // Parametrina klikattu arvo
	if (!loaded) { // Jos loaded = false, voidaan valita ala
		valittuAla = a.target.value;
		ala = data.alat[valittuAla];
	}
	closeNavbar(); // Sulkee mobiiliversiossa navbarin
}

// Navbarin sulku:

function closeNavbar() {
	let dropdowns = document.getElementsByClassName("navbar-collapse");
	for (let i = 0; i < dropdowns.length; i++) {
		let dropdown = dropdowns[i];
		if (dropdown.classList.contains('show')) { // Bootstrap lisää itse show-classin
			dropdown.classList.remove('show'); // Show-attribuutti poistetaan, jolloin myös sen arvo "block"
		}
	}
}

//Starts the game again
function uudestaan() {
	//nolla arvot
	roskienMaara = 10;
	roskat = "";
	arvotutRoskat = [];
	roskienTyypit = [];
	trashList = [];
	binElements = "";
	pisteet = 0;
	loaded = false;
	otsikko.style.display = 'block';
	pisteElementti.style.display = 'none';
	pelaaUudestaan.style.display = 'none';

	//aloittaa pelin alusta 
	aloita();
}