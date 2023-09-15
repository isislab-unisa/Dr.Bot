const ParsingClient = require('sparql-http-client/ParsingClient');
const jaro = require("wink-jaro-distance");
const fs = require("fs");

class CustomModule {
    constructor() {
        //Retrieving the configuration file
        this.configuration = JSON.parse(fs.readFileSync('./conf.json').toString());

        this.endpoint = this.configuration.endpoint;

        this.entities = {};
        if("entity" in this.configuration)
            this.entities = this.configuration["entity"];

        this.symptoms = {};
        if("symptoms" in this.entities)
            this.symptoms = this.entities["symptoms"];

        this.properties = {};
        if("property" in this.configuration)
            this.properties = this.configuration["property"];
    }

    //Returns all the symptoms in the configuration file
    getSymptoms() {
        return this.symptoms;
    }

    getSymptomsClass() {
        return "symptom class" in this.entities
    }

    getDiseaseClass() {
        return "disease class" in this.entities;

    }

    //Return the URI of the Entity named entityName
    getEntityURI(entityName) {
        let result = null;
        if(entityName in this.entities)
            result = this.entities[entityName].url;
        if(entityName in this.symptoms)
            result = this.symptoms[entityName].url;
        return result;
    }

    //Return the URI of the Property named propertyName
    getPropertyURI(propertyName) {
        return propertyName in this.properties ? this.properties[propertyName].url : null;
    }

    //Submits the SPARQL query to the endpoint defined in the configuration file
    async submitQuery(query) {
        const client = new ParsingClient({
            endpointUrl: 'https://query.wikidata.org/sparql',
            headers: {
                'user-agent': 'MedBot/1.0'
            }
        });
        const bindings = await client.query.select(query);
        let result = [];
        bindings.forEach(row =>
            Object.entries(row).forEach(([key, value]) => result.push(value.value) )
        )
        return result;
    }

    // Creates the query that gets the disease that matches the symptomCodes
    async getDiseases(recognizedSymptoms, rejectedSymptoms) {
        //Retrieving the properties and entities URIs
        //Retrieving the symptoms URIs
        let symptomsURIs = "";
        for (let r in recognizedSymptoms) {
            let URI = this.getEntityURI(recognizedSymptoms[r]);
            symptomsURIs += symptomsURIs === "" ? "<" + URI + ">" : " , <" + URI + ">";
        }
        let rejectedURIs = [];
        for (let r in rejectedSymptoms) {
            let URI = this.getEntityURI(rejectedSymptoms[r]);
            rejectedURIs.push(`<${URI}>`);
        }
        let symptomProperty = this.getPropertyURI("symptom or sign");
        if(!symptomProperty)
            return [];
        //Query construction
        let query = `SELECT DISTINCT ?diseaseLabel (COUNT(?symptom) AS ?symptomsCount) WHERE {
                            ?disease <${symptomProperty}> ${symptomsURIs} ; 
                                     rdfs:label ?diseaseLabel ;
                                     <${symptomProperty}> ?symptom` ;
        let instanceOfProperty = this.getPropertyURI("instance of");
        if(!instanceOfProperty) {
            if (this.getDiseaseClass()) {
                let diseaseClass = this.getEntityURI("disease class");
                if (!diseaseClass)
                    return [];
                query += ` ; <${instanceOfProperty}> <${diseaseClass}>`;
            }
            if (this.getSymptomsClass()) {
                let symptomClass = this.getEntityURI("symptom class");
                if (!symptomClass)
                    return [];
                query += ` . ?symptom <${instanceOfProperty}> <${symptomClass}>`;
            }
        }
        query +=  ` . FILTER(LANGMATCHES(LANG(?diseaseLabel), 'en'))`;
        for(let r in rejectedURIs) {
            query += ` . FILTER NOT EXISTS {?disease <${symptomProperty}> ${rejectedURIs[r]}}`
        }
        query += `} GROUP BY (?diseaseLabel)
                    ORDER BY(?symptomsCount)`;
        let response = await this.submitQuery(query);
        let diseases = [];
        for(let i = 0; i < response.length; i = i + 2) {
            diseases.push(response[i]);
        }
        let filteredDiseases = [];
        for(let d in diseases)
            if (!filteredDiseases.includes(diseases[d]) && !filteredDiseases.includes(diseases[d].toLowerCase()))
                filteredDiseases.push(diseases[d]);
        return filteredDiseases;
    }

    /* Creates the query that gets the symptoms of a disease labeled diseaseName,
       then return it minus the ones in symptomList */
    async getMissingSymptoms(diseaseName, symptomList) {
        //Retrieving the properties and entities URIs
        let symptomProperty = this.getPropertyURI("symptom or sign");
        if(!symptomProperty)
            return [];
        //Query construction
        let query = `SELECT DISTINCT ?symptomsLabel WHERE {
                            ?disease  rdfs:label "${diseaseName}"@en ;
                            <${symptomProperty}> ?symptoms . `;
        if(this.getSymptomsClass()){
            let instanceOfProperty = this.getPropertyURI("instance of");
            let symptomClass = this.getEntityURI("symptom class");
            if(!instanceOfProperty || !symptomClass)
                return [];
            query += `?symptoms <${instanceOfProperty}> <${symptomClass}> ;
                                rdfs:label ?symptomsLabel . `;
        }
        query += `FILTER(LANGMATCHES(LANG(?symptomsLabel), 'en'))`;
        for(let s in symptomList) {
            `FILTER NOT EXISTS { ?symptoms rdfs:label '${symptomList[s]}'@en} }`;
        }
        query += `}`;
        let response = await this.submitQuery(query);

        //Filtering the results removing the input symptoms and the duplicates
        let result = [];
        validation: for(let r in response) {
            let symptom = response[r].toLowerCase();
            for (let s in symptomList)
                if (jaro(symptomList[s], symptom).similarity > 0.8)
                    continue validation;
            for (let rs in result)
                if (jaro(result[rs], symptom).similarity > 0.8)
                    continue validation;
            result.push(symptom);
        }
        return result;
    }
}

module.exports = CustomModule