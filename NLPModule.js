const natural = require('natural');
const classifier = new natural.BayesClassifier();
const tokenizer = new natural.WordTokenizer();
const winkNLP = require('wink-nlp');
const model = require( 'wink-eng-lite-web-model' );
const readline = require('readline-sync');
const diagnosis = require('./diagnosisModule');
const customImplementation = require('./customModule');

let custom = new customImplementation();
const nlp = winkNLP(model);

//Retrieving the symptoms from configuration files and training the NLP model
let symptoms = custom.getSymptoms();
let patterns = [];
for(let e in symptoms)
    patterns.push({name:'symptom', patterns: [e.toString()]});
nlp.learnCustomEntities(patterns);

//Asking the input string
let symptomsInput = readline.question(" > How do you feel?\n > ");
let doc = nlp.readDoc(symptomsInput.toLowerCase());
//Custom Entities Recognition
let recognizedSymptom = doc.customEntities().out();
//No recognizedSymptom found
if(!recognizedSymptom.length)
    console.log("No valid symptom inserted.");
else
    //Execution of the diagnosis module
    diagnosis(recognizedSymptom, [], []);

const trainingData = [
    { text: 'Yes I have', label: 'positive' },
    { text: 'Yes i have', label: 'positive' },
    { text: 'I have', label: 'positive' },
    { text: 'I have it', label: 'positive' },
    { text: 'Yes I feel it', label: 'positive' },
    { text: 'Yes i feel it', label: 'positive' },
    { text: 'Absolutely', label: 'positive' },
    { text: 'Affirmative', label: 'positive' },
    { text: 'Certainly', label: 'positive' },
    { text: 'Absolutely', label: 'positive' },
    { text: 'Of course', label: 'positive' },
    { text: 'Affirmative', label: 'positive' },
    { text: 'Without a doubt', label: 'positive' },
    { text: 'For sure', label: 'positive' },
    { text: 'That\'s correct', label: 'positive' },
    { text: 'Yep', label: 'positive' },
    { text: 'Yup', label: 'positive' },
    { text: 'Yeah, sure', label: 'positive' },
    { text: 'Absolutely yes', label: 'positive' },
    { text: 'Totally', label: 'positive' },
    { text: 'yes I have', label: 'positive' },
    { text: 'yes i have', label: 'positive' },
    { text: 'i have', label: 'positive' },
    { text: 'i have it', label: 'positive' },
    { text: 'yes I feel it', label: 'positive' },
    { text: 'yes i feel it', label: 'positive' },
    { text: 'absolutely', label: 'positive' },
    { text: 'affirmative', label: 'positive' },
    { text: 'certainly', label: 'positive' },
    { text: 'absolutely', label: 'positive' },
    { text: 'of course', label: 'positive' },
    { text: 'affirmative', label: 'positive' },
    { text: 'without a doubt', label: 'positive' },
    { text: 'for sure', label: 'positive' },
    { text: 'that\'s correct', label: 'positive' },
    { text: 'yep', label: 'positive' },
    { text: 'yup', label: 'positive' },
    { text: 'yeah, sure', label: 'positive' },
    { text: 'absolutely yes', label: 'positive' },
    { text: 'totally', label: 'positive' },

    { text: 'No I haven\'t', label: 'negative' },
    { text: 'No I havent', label: 'negative' },
    { text: 'No I\'m sorry', label: 'negative' },
    { text: 'No not yet', label: 'negative' },
    { text: 'Negative I haven\'t', label: 'negative' },
    { text: 'Negative I havent', label: 'negative' },
    { text: 'No', label: 'negative' },
    { text: 'Nope', label: 'negative' },
    { text: 'Negative', label: 'negative' },
    { text: 'Don\'t', label: 'negative' },
    { text: 'No I don\'t', label: 'negative' },
    { text: 'Dont', label: 'negative' },
    { text: 'I dont', label: 'negative' },
    { text: 'No I dont', label: 'negative' },
    { text: 'no I haven\'t', label: 'negative' },
    { text: 'no I havent', label: 'negative' },
    { text: 'no I\'m sorry', label: 'negative' },
    { text: 'no not yet', label: 'negative' },
    { text: 'negative I haven\'t', label: 'negative' },
    { text: 'negative I havent', label: 'negative' },
    { text: 'no', label: 'negative' },
    { text: 'nope', label: 'negative' },
    { text: 'negative', label: 'negative' },
    { text: 'don\'t', label: 'negative' },
    { text: 'no I don\'t', label: 'negative' },
    { text: 'dont', label: 'negative' },
    { text: 'i dont', label: 'negative' },
    { text: 'no i dont', label: 'negative' },

    { text: 'I don\'t know', label: 'neutral' },
    { text: 'I dont know', label: 'neutral' },
    { text: 'No idea', label: 'neutral' },
    { text: 'Not sure', label: 'neutral' },
    { text: 'no idea', label: 'neutral' },
    { text: 'not sure', label: 'neutral' },

];
trainingData.forEach(data => {
    const tokens = tokenizer.tokenize(data.text);
    classifier.addDocument(tokens, data.label);
});

classifier.train();

exports.analyzeSentiment = answer => {
    const tokens = tokenizer.tokenize(answer);
    return  classifier.classify(tokens);
}