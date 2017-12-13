"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
///<reference path="../../typings/globals/node/index.d.ts"/>
//Import Model and mongoose
const Element = require("./model");
const mongoose = require('mongoose');
const fs = require('fs');
const pdfDocument = require('pdfkit');
const path = require('path');
const mime = require('mime');
const multiparty = require('multiparty');
/**
 * Controller Module
 * @class Controller
 *
 */
//Tells mongoose the name of the db where it should connect to
mongoose.connect("mongodb://localhost/awpDB");
mongoose.set('debug', true);
/*POST controller**/
/**
 * Author: Jan Kiefer
 *
 * POST controller
 *
 * This method creates a new Element and store it in the database.
 * @method createElement
 * @param req: {Element}
 * @param res: {Element}
 * @author Jan Kiefer
 */
let createElement = function (req, res) {
    let newElement = new Element(req.body);
    newElement.id = req.params.id;
    newElement.save((err) => {
        if (err) {
            res.json(err);
            return;
        }
        res.json(newElement);
    });
};
/**
 * Author: Tobias Dahlke
 *
 * Update Element Controller
 *
 * Updates the Element with the given Id to the new given Body.
 * @method updateElement
 * @param req {Element} New Element Body, {String} ID of Element to Update
 * @param res Status Message
 * @author Tobias Dahlke
 */
let updateElement = function (req, res) {
    let query = { id: req.params.id };
    Element.findOne(query, function (err, element) {
        if (err) {
            res.send(err);
            return;
        }
        let update = {
            level: req.body.level,
            pos: req.body.pos,
            parent: req.body.parent,
            icon: req.body.icon,
            data: req.body.data
        };
        element.update(update, function (err) {
            if (element) {
                element.update(update, function (err) {
                    if (err) {
                        res.send(err);
                        return;
                    }
                    res.json({ message: 'Updated' });
                });
            }
            else {
                res.status(404);
                res.json({ info: 'No such Element found with id:' + req.params.id });
            }
        });
    });
};
/**
 * Author: Jan Kiefer
 *
 * GET Element Controller
 *
 * This Method searches a database entry by id.
 * @method getElement
 * @param req {String} Element ID
 * @param res {Element}
 * @author Jan Kiefer
 */
let getElement = function (req, res) {
    let query = { id: req.params.id };
    Element.findOne(query, { _id: 0 }, function (err, Element) {
        if (err) {
            res.json({ info: 'error at get request', error: err });
            return;
        }
        ;
        if (Element) {
            res.json({ data: Element });
        }
        else {
            res.status(404);
            res.json({ info: 'No such Element found with id:' + req.params.id });
        }
    });
};
/**
 * Author: Jan Kiefer
 *
 * GET all Element controller
 *
 * @method getAllElements
 * @param req {}
 * @param res {[Element]}
 * @Author Jan Kiefer
 */
let getAllElements = function (req, res) {
    Element.find({}, { _id: 0 }, (err, Elements) => {
        if (err) {
            res.json({ info: 'error during find Elements', error: err });
            return;
        }
        res.json({ data: Elements });
    });
};
/**
 * Author: Tobias Dahlke
 *
 * This Function returns the elements which contain the given Search-Term in the text or the title.
 * @method getSearch
 * @param req {String} Search-Term
 * @param res {[ELement]} All found Elements
 * @author Tobias Dahlke
 */
let getSearch = function (req, res) {
    let query = Element.find({ $text: { $search: req.body.attr } }).select('id -_id');
    query.exec(function (err, Element) {
        if (err) {
            res.json({ info: 'error at get request', error: err });
            return;
        }
        res.json({ element: Element });
    });
};
/**
 * Author: Jan Kiefer
 *
 * GET Pdf Export
 *
 * 1. creates the PDF
 * 2. iterates through all Elements of the request
 * 3. terates through all dataStructures of the Element
 * 4. If it is a Image, print it on PDF. NOTE: will only work with png files.
 * 5. If it is a text, call createContentArray() to generate a String which improves the markdown interpretation.
 * 6. Write the PDF File with a random number name and delete it after download.
 * @method getPDFExport
 * @param req {id, data} of Element
 * @param res {PDF}
 * @author Jan Kiefer
 */
let getPDFExport = function (req, res) {
    //create Doc without Page
    let doc = new pdfDocument({
        autoFirstPage: false,
        font: 'Helvetica'
    });
    let stream = doc.pipe(res);
    if (req.body !== []) {
        for (let element of req.body) {
            doc.on('pageAdded', function () {
                doc.image('./footerpng/footer.png', 37.5, 790.701, { width: 520 });
            });
            //Adds the first page
            doc.addPage({
                font: 'Helvetica',
                size: "A4"
            });
            //Print first Header
            printHeader(doc, element.data.heading);
            doc.moveDown(0.5);
            let lastYPosition = 0;
            let maxY = 841.29 - 106.68 - 100;
            //Iterate through dataStructures
            for (let dataStructure of element.data.structure) {
                if (dataStructure.componentType === "img") {
                    if (typeof dataStructure.imgHeading !== 'undefined') {
                        if (dataStructure.imgHeading !== null) {
                            doc.fontSize(15);
                            doc.fillColor('#0069B3');
                            doc.text(dataStructure.imgHeading);
                            doc.moveDown(0.5);
                            lastYPosition = doc.y;
                        }
                    }
                    let img = dataStructure.content;
                    let imgdata = getPngDimensions(img);
                    //Reformat the picture size
                    if (imgdata.width <= 495 && imgdata.height <= maxY) {
                        //Nothing
                        let options = {
                            height: imgdata.height,
                            width: imgdata.width
                        };
                        if (lastYPosition + options.height > maxY) {
                            doc.addPage({
                                font: 'Helvetica',
                                size: "A4"
                            });
                        }
                        doc.image(img, options);
                        doc.moveDown(0.5);
                        lastYPosition = doc.y;
                    }
                    if (imgdata.width < 495 && imgdata.height > maxY) {
                        let factor = maxY / imgdata.height;
                        let options = {
                            height: maxY,
                            width: imgdata.width * factor
                        };
                        if (lastYPosition + options.height > maxY) {
                            doc.addPage({
                                font: 'Helvetica',
                                size: "A4"
                            });
                        }
                        doc.image(img, options);
                        doc.moveDown(0.5);
                        lastYPosition = doc.y;
                    }
                    if (imgdata.width > 495 && imgdata.height > maxY) {
                        let factor = 495 / imgdata.width;
                        let options = {
                            height: imgdata.height * factor,
                            width: 495
                        };
                        let yFactor = 1;
                        while (options.height > maxY) {
                            options.width = 495 * yFactor;
                            options.height = yFactor * imgdata.height;
                            yFactor = maxY / options.height;
                        }
                        if (lastYPosition + options.height > maxY) {
                            doc.addPage({
                                font: 'Helvetica',
                                size: "A4"
                            });
                        }
                        doc.image(img, options);
                        doc.moveDown(0.5);
                        lastYPosition = doc.y;
                    }
                    if (imgdata.width > 495 && imgdata.height < maxY) {
                        //Nothing
                        let factor = 495 / imgdata.width;
                        let options = {
                            width: 495,
                            height: imgdata.height * factor
                        };
                        if (lastYPosition + options.height > maxY) {
                            doc.addPage({
                                font: 'Helvetica',
                                size: "A4"
                            });
                        }
                        doc.image(img, options);
                        doc.moveDown(0.5);
                        lastYPosition = doc.y;
                    }
                    //Move 1 line down
                    doc.moveDown(1);
                }
                if (dataStructure.componentType === "text") {
                    //Generate the ContentArray
                    let contentArray = createContentArray(dataStructure.content);
                    //To save the first Element of a line
                    let lastLineBreak = 0;
                    for (let i = 0; i < contentArray.length; i++) {
                        //Check if the array Entry begins with a Header
                        if (contentArray[lastLineBreak].startsWith('-?1') ||
                            contentArray[lastLineBreak].startsWith('-?2')) {
                            let headerTag;
                            //Set font size for the following entrys
                            if (contentArray[lastLineBreak].startsWith('-?1')) {
                                headerTag = 20;
                            }
                            if (contentArray[lastLineBreak].startsWith('-?2')) {
                                headerTag = 15;
                            }
                            doc.fontSize(headerTag);
                            doc.fillColor('#0069B3');
                            //The last Array Entry does not have a \n Entry, add it here for the program flow
                            if (contentArray[contentArray.length - 1] !== '\n') {
                                contentArray.push('\n');
                            }
                            // NextI help to check if the next Element of the array need a line break
                            let nextI = contentArray.length - 1;
                            if (i === contentArray.length - 1) {
                                nextI = i;
                            }
                            if (i < contentArray.length - 1) {
                                nextI = i + 1;
                            }
                            //If the next Element is no \n, than use the Line Method which puts all elements in one line
                            if (contentArray[nextI] !== '\n') {
                                docLine(doc, contentArray[i]);
                                //If not do a LineBreak
                            }
                            else {
                                docLineBreak(doc, contentArray[i]);
                            }
                        }
                        else {
                            //Same as above but for normal Text (No Header)
                            doc.fontSize(10);
                            doc.fillColor('black');
                            if (contentArray[contentArray.length - 1] !== '\n') {
                                contentArray.push('\n');
                            }
                            let nextI = contentArray.length - 1;
                            if (i === contentArray.length - 1) {
                                nextI = i;
                            }
                            if (i < contentArray.length - 1) {
                                nextI = i + 1;
                            }
                            if ((contentArray[i].startsWith('-?3') ||
                                contentArray[i].startsWith('-?4') ||
                                contentArray[i].startsWith('-?5'))
                                && contentArray[nextI] === '') {
                                nextI + 1;
                                if (nextI <= contentArray.length - 1) {
                                    nextI = contentArray.length - 1;
                                }
                                if (contentArray[nextI] !== '\n') {
                                    docLine(doc, contentArray[i]);
                                }
                                else {
                                    docLineBreak(doc, contentArray[i]);
                                }
                            }
                            else {
                                if (contentArray[nextI] !== '\n') {
                                    docLine(doc, contentArray[i]);
                                }
                                else {
                                    docLineBreak(doc, contentArray[i]);
                                }
                            }
                        }
                        //Set the value of the lastLineBreak
                        if (contentArray[i] == '\n') {
                            lastLineBreak = i + 1;
                        }
                    }
                }
            }
        }
    }
    //Write the pdfFile
    doc.end();
    res.setHeader('Content-Type', 'application/pdf');
    stream.on('finish', function () {
        stream.pipe(res);
    });
};
/**
 * Author: Jan Kiefer
 *
 * Sets the Font Type according to pefix and Text Option with lineBreak
 *
 * @method docLineBreak
 * @param doc {PDF} the PDF Document
 * @param content {String} the Content of a datastructure
 * @author Jan Kiefer
 */
let docLineBreak = function (doc, content) {
    if (!content.startsWith('-?')) {
        doc.text(content, { continued: false });
    }
    if (content.startsWith('-?1')) {
        doc.text(content.substring(4), { continued: false });
    }
    if (content.startsWith('-?2')) {
        doc.text(content.substring(4), { continued: false });
    }
    if (content.startsWith('-?3')) {
        doc.font('Helvetica-Oblique');
        doc.text(content.substring(3), { continued: false });
        doc.font('Helvetica');
    }
    if (content.startsWith('-?4')) {
        doc.font('Helvetica-Bold');
        doc.text(content.substring(3), { continued: false });
        doc.font('Helvetica');
    }
    if (content.startsWith('-?5')) {
        doc.font('Helvetica-BoldOblique');
        doc.text(content.substring(3), { continued: false });
        doc.font('Helvetica');
    }
};
//
/**
 * Author: Jan Kiefer
 *
 * Set the Font Type and Text Option without lineBreak
 * @method docLine
 * @param doc {PDF} the PDF Document
 * @param content {String} the Content of a datastructure
 * @author Jan Kiefer
 */
let docLine = function (doc, content) {
    if (!content.startsWith('-?')) {
        doc.text(content, { continued: true });
    }
    if (content.startsWith('-?1')) {
        doc.text(content.substring(4), { continued: true });
    }
    if (content.startsWith('-?2')) {
        doc.text(content.substring(4), { continued: true });
    }
    if (content.startsWith('-?3')) {
        doc.font('Helvetica-Oblique');
        doc.text(content.substring(3), { continued: true });
        doc.font('Helvetica');
    }
    if (content.startsWith('-?4')) {
        doc.font('Helvetica-Bold');
        doc.text(content.substring(3), { continued: true });
        doc.font('Helvetica');
    }
    if (content.startsWith('-?5')) {
        doc.font('Helvetica-BoldOblique');
        doc.text(content.substring(3), { continued: true });
        doc.font('Helvetica');
    }
};
/**
 * Author: Jan Kiefer
 *
 * Print the First Header of a page

 * @method printHeader
 * @param doc {PDF} the PDF Document
 * @param header {String} the Header of a Element
 * @author Jan Kiefer
 */
let printHeader = function (doc, header) {
    let options = {
        align: "center"
    };
    //Print Header
    doc.fillColor('#0069B3');
    doc.fontSize(20);
    doc.text(header, options);
};
/**
 * Author: Tobias Dahlke
 *
 * This function is there to interpret the Markdown Language. It gets the content of the data and
 * reads out the Markdown specific Annotations. Afterwards it splits the content into an Array and adds specific Codes
 * in front of each part of the Array that is effected by Markdown.
 * This Code will get interpreted by the pdfExport function so that it can change the text according to the Annotations.
 * @method createContentArray
 * @param content This is the content from the data part of the Element.
 * @returns {Array<String>} Returns the Content in form of an Array with new Annotations for Markdown.
 * @author Tobias Dahlke
 */
let createContentArray = function (content) {
    let arrayReturn = Array();
    let contentArray = content.split(/(\n)/g);
    // Iterates through each String in the just split Array
    for (let j = 0; j < contentArray.length; j++) {
        let contentString = contentArray[j];
        let newArray = search(contentString);
        // Array gets extended for every new String
        for (let i = 0; i < newArray.length; i++) {
            arrayReturn.push(newArray[i]);
        }
    }
    return arrayReturn;
};
/**
 * Author: Tobias Dahlke
 *
 * This Method is searching the given content for Markdown specific Annotations and returns an Array of the Content with
 * the addition of specfic Codes for Text-Type identification.
 * @method search
 * @param content The content which is given to search through.
 * @returns {Array<String>} An Array filled with the content and Codes for Text-Type identification.
 * @author Tobias Dahlke
 */
let search = function (content) {
    let contentArray = Array();
    // Returns Enumeration Value if there is one
    content = isItEnumeration(content);
    // Returns Headline Value if there is one
    content = isItHeadline(content);
    //count number of Stars and Equal Symbols (only in the beginning of the String)
    contentArray = findStars(content, 0, 0, contentArray);
    return contentArray;
};
/**
 * Author: Tobias Dahlke
 *
 * This Method checks if the given content is an Enumeration. If yes it alters it.
 * @method isItEnumeration
 * @param content
 * @returns {String}
 * @author Tobias Dahlke
 */
let isItEnumeration = function (content) {
    //Looks if it Starts with a * (with only ' ' before and after)
    for (let i = 0; i <= content.length; i++) {
        if ((content.charAt(i) === ' ') || (content.charAt(i) === '*')) {
            if (content.charAt(i) === '*') {
                if (content.charAt(i + 1) === ' ') {
                    content = content.replace("*", "-");
                    return content;
                }
                else {
                    return content;
                }
            }
        }
        else {
            return content;
        }
    }
};
/**
 * Author: Tobias Dahlke
 *
 * This Method checks if the given content is a headline. If yes it deletes the '#' and adds a Code in front of
 * the content.
 *
 * For the Headlines the Code Value:
 * -?1    # + ##
 * -?2    ### + #### + ######
 * @method isItEnumeration
 * @param content
 * @returns {String} New content String.
 * @author Tobias Dahlke
 */
let isItHeadline = function (content) {
    let numberEquals = 0;
    for (let i = 0; i <= content.length; i++) {
        if (content.charAt(i) === '#') {
            numberEquals++;
        }
        else {
            i = content.length + 1;
        }
    }
    if (numberEquals === 0) {
        return content;
    }
    if (numberEquals <= 2) {
        content = content.slice(numberEquals);
        content = '-?1' + content;
        return content;
    }
    if (numberEquals > 2) {
        content = content.slice(numberEquals);
        content = '-?2' + content;
        return content;
    }
};
/**
 * Author: Tobias Dahlke
 *
 * Is searching for all '*' in the given content because they can identify Markdown definitions. When finding the First
 * Star it checks if this star is for Markdown. If it is then the Programm will search for the Closing Stars of the
 * definition. If not it searches for the next potential Star.
 * @method findStars
 * @param content Content to search.
 * @param index Index where to start the search.
 * @param initalIndex Index where the search started.
 * @param contentArray the Content Array that needs to be filled with the content.
 * @returns {Array<String>} The contentArray filled with the content.
 * @author Tobias Dahlke
 */
let findStars = function (content, index, initalIndex, contentArray) {
    // Checks if text contains Markdown stars
    let starPos = content.indexOf('*', index);
    if (starPos !== -1) {
        // Checks if star is followed by a space, If not search next Star
        if (content.charAt(starPos + 1) === ' ') {
            findStars(content, starPos + 1, initalIndex, contentArray);
            return contentArray;
        }
    }
    else {
        contentArray.push(content.slice(initalIndex));
        return contentArray;
    }
    let starNum = numberOfStars(content, starPos);
    // Push the String before the star
    contentArray.push(content.slice(initalIndex, starPos));
    contentArray = findClosingStars(content, starNum, starPos, contentArray);
    return contentArray;
};
/**
 * Author: Tobias Dahlke
 *
 * Finds the closing Stars in the content for the Markdown definition found in findStars().
 * When found it adds the String between those Stars to the Array and alters it by Setting a
 * depending Code in front of it.
 * @method findClosingStars
 * @param content
 * @param starNum Number of Stars found in findStars()
 * @param firstStarPos Place of found Star.
 * @param contentArray Content Array that needs to be returned filled.
 * @returns {Array<String>} The contentArray filled with the content.
 * @author Tobias Dahlke
 */
let findClosingStars = function (content, starNum, firstStarPos, contentArray) {
    // Checks if text contains stars
    let newStarPos = content.indexOf('*', firstStarPos + starNum);
    if (newStarPos !== -1) {
        // Checks if star is initiated by a space, If not search next Star
        if (content.charAt(newStarPos - 1) === ' ') {
            findClosingStars(content, starNum, newStarPos + 1, contentArray);
        }
    }
    else {
        contentArray.push(content.slice(firstStarPos + starNum));
        return contentArray;
    }
    // Number of new found Stars
    let newStarNum = numberOfStars(content, newStarPos);
    // Number of Stars equal each other then push. Else search again
    if (newStarNum === starNum) {
        let pushVal = "";
        switch (starNum) {
            /**
             * Sets Prefix depending on Number of Stars
             * -?3        italic
             * -?4        bold
             * -?5        both
             */
            case 1:
                pushVal = '-?3' + content.slice(firstStarPos + starNum, newStarPos);
                break;
            case 2:
                pushVal = '-?4' + content.slice(firstStarPos + starNum, newStarPos);
                break;
            case 3:
                pushVal = '-?5' + content.slice(firstStarPos + starNum, newStarPos);
                break;
            default:
                break;
        }
        contentArray.push(pushVal);
    }
    else {
        findClosingStars(content, starNum, newStarPos + 1, contentArray);
    }
    // Search Rest of Content for more Markdown Stars
    contentArray = findStars(content, newStarPos + newStarNum, newStarPos + newStarNum, contentArray);
    return contentArray;
};
/**
 * Author: Tobias Dahlke
 *
 * Is counting the number of Stars in the content from the first Star.
 * @method numberOfStars
 * @param content
 * @param starPos Position of first Star
 * @returns {number} Number of Stars
 */
let numberOfStars = function (content, starPos) {
    if (content.charAt(starPos + 1) === '*') {
        if (content.charAt(starPos + 2) === '*') {
            return 3;
        }
        return 2;
    }
    return 1;
};
/**
 * Turns Bytes into integer values
 * @method bytesToInteger
 * @param bytes {byte}
 * @returns {number} the size data of a png file
 */
function toInt32(bytes) {
    return (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3];
}
/**
 * Gets the Dimensions of a png as int
 * @method getsDimensionOfPng
 * @param data {String}
 * @returns {{width: number, height: number}}
 */
function getDimensions(data) {
    return {
        width: toInt32(data.slice(16, 20)),
        height: toInt32(data.slice(20, 24))
    };
}
let base64Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
/**
 * Decodes the base64 png
 * @method decodesBase64
 * @param data
 * @returns {Array}
 */
function base64Decode(data) {
    var result = [];
    var current = 0;
    for (var i = 0, c; c = data.charAt(i); i++) {
        if (c === '=') {
            if (i !== data.length - 1 && (i !== data.length - 2 || data.charAt(i + 1) !== '=')) {
                throw new SyntaxError('Unexpected padding character.');
            }
            break;
        }
        var index = base64Characters.indexOf(c);
        if (index === -1) {
            throw new SyntaxError('Invalid Base64 character.');
        }
        current = (current << 6) | index;
        if (i % 4 === 3) {
            result.push(current >> 16, (current & 0xff00) >> 8, current & 0xff);
            current = 0;
        }
    }
    if (i % 4 === 1) {
        throw new SyntaxError('Invalid length for a Base64 string.');
    }
    if (i % 4 === 2) {
        result.push(current >> 4);
    }
    else if (i % 4 === 3) {
        current <<= 6;
        result.push(current >> 16, (current & 0xff00) >> 8);
    }
    return result;
}
/**
 *Method to start the base64 decode Process
 * @method startDecodeProcess
 * @param dataUri {String}
 * @returns {{width: number, height: number}}
 */
let getPngDimensions = function (dataUri) {
    return getDimensions(base64Decode(dataUri.substring(22)));
};
module.exports = {
    createElement: createElement,
    updateElement: updateElement,
    getElement: getElement,
    getAllElements: getAllElements,
    getSearch: getSearch,
    getPDFExport: getPDFExport,
    createContentArray: createContentArray,
    getPngDimensions: getPngDimensions
};
