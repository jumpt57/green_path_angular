'use strict';
//MODEL
var Capture = require('./capture.model');
var Ville = require('../ville/ville.model');
var Departement = require('../departement/departement.model');


//Open Street MAp
var geocoderProvider = 'openstreetmap';

var httpAdapter = 'http';
// optionnal 
var extra = {
    language:"fr" 
};
 
var geocoder = require('node-geocoder')(geocoderProvider, httpAdapter,extra);


/*******************************************************************************************
								~	FONCTIONS	~
*******************************************************************************************/

var validationError = function(res, err) {
  return res.json(422, err);
};

//Récupère toutes les captures
exports.getAll = function(req,res,next){
	Capture.find().exec(function(err,captures){
		if(err)
			return res.send(404,err);
		else
			res.json(captures);
	});
};

//Récupère les captures correspondant à la recherche effectuée
exports.search = function(req,res,next){
	//Récupération des critères de recherche
	var critere = req.query;
	var capteur_dateDeb = critere.dateDeb;
	var capteur_dateFin = critere.dateFin;
	var capteur_ville = "";
	var capteur_departement = "";
	var query = "";

	//Traitement de la date
	if(capteur_dateDeb!==""){
		date = capteur_dateDeb.split('-');
		year = date[0];
		month = date[1];
		day = date[2];
		capteur_dateDeb = day + "/" + month + "/" + year;
	}
	if(capteur_dateFin!==""){
		date = capteur_dateFin.split('-');
		year = date[0];
		month = date[1];
		day = date[2];
		capteur_dateFin = day + "/" + month + "/" + year;
	}
	else{
		var d = new Date();
		var day = d.getDate();
		var month = d.getMonth() + 1;
		var year = d.getFullYear();
		if(month<10){
			month = '0' + month;
		}
		capteur_dateFin = day + '/' + month + '/' + year;	
	}

	//Recherche
	if(capteur_dateDeb=="" && capteur_dateFin!==""){
		if(capteur_ville!==""){
			query = Capture.find({ville:capteur_ville,date:{$lt:capteur_dateFin}});
		}
		else{
			query = Capture.find({departement:capteur_departement,date:{$lt:capteur_dateFin}});
		}
	}
	else{
		if(capteur_ville!==""){
			query = Capture.find({ville:capteur_ville,date:{$gt:capteur_dateDeb,$lt:capteur_dateFin}});
		}
		else{
			query = Capture.find({departement:capteur_departement,date:{$gt:capteur_dateDeb,$lt:capteur_dateFin}});
		}
	}

	query.exec(function(err,captures){
		if(err)
			return res.send(404,err);
		else
			return res.json(captures);
	});
};

//Enregistrement d'une capture
exports.create = function(req,res,next){
	//Récupération des données envoyés par l'application
	var critere = req.body;
	var capteur_lng = critere.lng;
	var capteur_lat = critere.lat;
	var capteur_temperature = critere.temperature;
	var capteur_humidite = critere.humidite;
	var capteur_son = critere.son;
	var capteur_co2 = critere.co2;

	//On incrémente toutes les données afin de déterminer s'ils sont bien des number
	capteur_lng++;
	capteur_lat++;
	capteur_temperature++;
	capteur_humidite++;
	capteur_son++;
	capteur_co2++;

	//Création de la nouvelle capture
	var capture = new Capture();

	if(capteur_lng !== NaN)
		capture.lng = critere.lng;
	else
		capteur_lng = null;
	if(capteur_lat !== NaN)
		capture.lat = critere.lat;
	else
		capteur_lat = null;
	if(capteur_temperature !== NaN)
		capture.temperature = critere.temperature;
	else
		capteur_temperature = null;
	if(capteur_humidite !== NaN)
		capture.humidite = critere.humidite;
	else
		capteur_humidite = null;
	if(capteur_son !== NaN)
		capture.son = critere.son;
	else
	capture.departement = res.state;
		capteur_son = null;
	if(capteur_co2 !== NaN)
		capture.co2 = critere.co2;
	else
		capteur_co2 = null;

	if(capture.lng !== undefined || capture.lat !== undefined || capture.temperature !== undefined || capture.humidite !== undefined || capture.son !== undefined || capture.co2 !== undefined){

		geocoder.reverse({lat:capture.lat, lon:capture.lng})
		    .then(function(localisation) {
		        console.log(localisation);
		        capture.ville = localisation[0].city;

		        Ville.find({nom:localisation[0].city}).exec(function(err,villes){
		        	Departement.find({code:villes[0].departement}).exec(function(err,departements){
		        		capture.departement = departements[0].nom;
		        		var d = new Date();
						var day = d.getDate();
						var month = d.getMonth() + 1;
						var year = d.getFullYear();
						if(month<10){
							month = '0' + month;
						}
						capture.date = day + '/' + month + '/' + year;
		        		capture.save(function(err,captures){
							if(err)
								return res.send(404,err);
							else
								return res.json(captures);
						});
		        	});
		        });
		    })
		    .catch(function(err) {
		        console.log(err);
		    });
	}
	else{
		return res.send(404,'Données incorrectes');
	}
};