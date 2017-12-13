///<reference path="../../typings/globals/node/index.d.ts"/>
//Import Model and mongoose
import * as Element from './model';
import {Request, Response} from 'express';
const mongoose = require('mongoose');
const fs = require('fs');
const multiparty = require('multiparty');
import {} from 'jasmine';
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
let createElement = function (req: Request, res: Response): void {
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
let getElement = function (req: Request, res: Response): void {
    let query = {id: req.params.id};

    Element.findOne(query, {_id: 0}, function (err, Element) {
        if (err) {
            res.json({info: 'error at get request', error: err});
            return;
        }
        ;
        if (Element) {
            res.json({data: Element});
        } else {
            res.status(404);
            res.json({info: 'No such Element found with id:' + req.params.id});
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
let getAllElements = function (req: Request, res: Response): void {
    Element.find({}, {_id: 0}, (err, Elements) => {
        if (err) {
            res.json({info: 'error during find Elements', error: err});
            return;
        }
        res.json({data: Elements});
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

/*
let getPDFExport = function (req: Request, res: Response): void {
    //create Doc without Page
    let doc = new pdfDocument({
        autoFirstPage: false,
        font: 'Helvetica'
    });

    let stream = doc.pipe(res);


    if(req.body !== []) {
        for (let element of req.body) {
            doc.on('pageAdded', function () {
                doc.image('./footerpng/footer.png', 37.5, 790.701, {width: 520});
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
                        }
                        if (lastYPosition + options.height > maxY) {
                            doc.addPage({
                                font: 'Helvetica',
                                size: "A4"
                            });
                        }
                        doc.image(img, options)
                        doc.moveDown(0.5);
                        lastYPosition = doc.y;
                    }

                    if (imgdata.width < 495 && imgdata.height > maxY) {
                        let factor = maxY / imgdata.height;
                        let options = {
                            height: maxY,
                            width: imgdata.width * factor
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
                        let factor = 495 / imgdata.width
                        let options = {
                            width: 495,
                            height: imgdata.height * factor
                        }
                        if (lastYPosition + options.height > maxY) {
                            doc.addPage({
                                font: 'Helvetica',
                                size: "A4"
                            });
                        }
                        doc.image(img, options)
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
                            } else {
                                docLineBreak(doc, contentArray[i]);
                            }

                        } else {
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
                                    nextI = contentArray.length - 1
                                }
                                if (contentArray[nextI] !== '\n') {
                                    docLine(doc, contentArray[i]);

                                } else {
                                    docLineBreak(doc, contentArray[i]);
                                }

                            } else {

                                if (contentArray[nextI] !== '\n') {
                                    docLine(doc, contentArray[i]);

                                } else {
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
*/





module.exports = {
    createElement: createElement,
    updateElement: updateElement,
    getElement: getElement,
    getAllElements: getAllElements,
};
