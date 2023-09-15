const customImplementation = require('./customModule');
const readline = require('readline-sync');
const nlpModule = require('./NLPModule');
let custom = new customImplementation();

async function diagnosis(recognizedSymptom, unreconizedSymptoms, rejectedSymptoms) {
    // Retrieving the diseases matching the symptoms
    let diseases = await custom.getDiseases(recognizedSymptom, rejectedSymptoms);
    if (!diseases.length) {
        // No diseases found error
        console.log("No diseases compatible with your symptoms");
        return;
    }
    let followUpSymptom = (await custom.getMissingSymptoms(diseases[0], recognizedSymptom.concat(unreconizedSymptoms)));
    if(!followUpSymptom.length || diseases.length === 1) {
        // Visualizing the diseases with the missingSymptoms
        let diagnosis = [];
        for (let d in diseases) {
            let missingSymptoms = await custom.getMissingSymptoms(diseases[d], recognizedSymptom.concat(unreconizedSymptoms));
            let disease = {};
            disease.name = diseases[d];
            disease.missingSymptoms = missingSymptoms;
            diagnosis.push(disease);
        }
        if(unreconizedSymptoms.length)
            console.log(` > The symptoms you didn't recognized are ${[...unreconizedSymptoms]}`)
        console.log(` > Your symptoms match exactly ${diagnosis[0]['name']}!`)
        if(diagnosis[0]['missingSymptoms'].length > 0)
            console.log(` > Missing symptoms: ${[... diagnosis[0]['missingSymptoms']]}`);
        if(diagnosis.length > 1) {
            console.log(" > Other diseases that can match the diagnosis:");
            for (let r = 1; r < diagnosis.length; r++) {
                console.log(` > ${diagnosis[r]['name']}`);
                console.log(` > Missing symptoms: ${[...diagnosis[r]['missingSymptoms']]}`);
            }
        }
    }
    else{
        let response = readline.question(` > Do you have ${followUpSymptom[0]}?\n > `);
        let sentiment = nlpModule.analyzeSentiment(response);
        if (sentiment === "positive")
            recognizedSymptom.push(followUpSymptom[0]);
        if (sentiment === "negative")
            rejectedSymptoms.push(followUpSymptom[0]);
        if(sentiment === "neutral")
            unreconizedSymptoms.push(followUpSymptom[0]);
        diagnosis(recognizedSymptom, unreconizedSymptoms, rejectedSymptoms);
    }
}

module.exports = diagnosis;