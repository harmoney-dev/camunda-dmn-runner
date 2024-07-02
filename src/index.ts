import fs from 'fs';
import csv from 'csv-parser';
import path from 'path';

// Define the interfaces for DMN conf files
interface TestCase {
    inputs: { [key: string]: boolean | number | string };
    results: Array<{
        outputs: { [key: string]: boolean | number | string };
        rowIndex: string;
    }>;
}

interface OutputJSON {
    data: {
        inputs: Array<{
            key: string;
            values: Array<boolean | number | string>;
        }>;
        testCases: TestCase[];
        variables: any[];
    };
    decisionId: string;
    dmnPath: string[];
    isActive: string;
}

// Define the functions to process CSV files and skip the title rows
function parseCSV(filePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const results: any[] = [];
        let rowIndex = 0;
        
        const rl = require('readline').createInterface({
            input: fs.createReadStream(filePath),
            crlfDelay: Infinity
        });

        const tempFile = path.join(path.dirname(filePath), 'temp.csv');
        const tempStream = fs.createWriteStream(tempFile);

        rl.on('line', (line: string) => {
            if (rowIndex >= titleRowsCount) {
                tempStream.write(line + '\n');
            }
            rowIndex++;
        }).on('close', () => {
            tempStream.end();

            fs.createReadStream(tempFile)
                .pipe(csv())
                .on('data', (data) => {
                    results.push(data);
                })
                .on('end', () => {
                    fs.unlinkSync(tempFile); // Clean up the temporary file
                    resolve(results);
                })
                .on('error', (err) => {
                    fs.unlinkSync(tempFile); // Clean up in case of an error
                    reject(err);
                });
        }).on('error', (err: any) => {
            tempStream.end();
            reject(err);
        });
    });
}

// Define the functions to get decisionId and dmnFile from the input file
async function getDecisionInfo(filePath: string): Promise<{ decisionId: string; dmnFile: string }> {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n');

    if (lines.length < titleRowsCount) {
        throw new Error('The input file does not contain enough lines for decisionId and dmnFile.');
    }

    const decisionIdLine = lines[0].split(',');
    const dmnFileLine = lines[1].split(',');

    if (decisionIdLine.length < titleRowsCount || dmnFileLine.length < titleRowsCount) {
        throw new Error('The input file does not contain valid decisionId and dmnFile lines.');
    }

    const decisionId = decisionIdLine[1].trim();
    const dmnFile = dmnFileLine[1].trim();

    console.log(`decisionId="${decisionId}"`);
    console.log(`dmnFile="${dmnFile}"`);

    return { decisionId, dmnFile };
}

// Transform the CSV data into the desired JSON format
function transformData(rows: any[], decisionId: string, dmnFile: string): OutputJSON {
    const inputsMap: { [key: string]: Set<boolean | number | string> } = {};
    const testCases: TestCase[] = [];
    const inputKeys = Object.keys(rows[0]).filter(key => key.startsWith('input:')).map(key => key.replace('input:', ''));
    const outputKeys = Object.keys(rows[0]).filter(key => key.startsWith('output:')).map(key => key.replace('output:', ''));

    rows.forEach((row, index) => {
        const inputs: { [key: string]: boolean | number | string } = {};
        const outputs: { [key: string]: boolean | number | string } = {};

        inputKeys.forEach(inputKey => {
            let value: boolean | number | string;
            const inputValue = row[`input:${inputKey}`];
            
            if (inputValue === null || inputValue === undefined || inputValue === '') {
                value = "";
            } else if (inputValue === 'True') {
                value = true;
            } else if (inputValue === 'False') {
                value = false;
            } else if (!isNaN(inputValue)) {
                value = parseFloat(inputValue);
            } else {
                value = inputValue;
            }

            inputs[inputKey] = value;

            if (!inputsMap[inputKey]) {
                inputsMap[inputKey] = new Set();
            }
            inputsMap[inputKey].add(value);
        });

        outputKeys.forEach(outputKey => {
            let value: boolean | number | string;
            if (row[`output:${outputKey}`] === 'True') {
                value = true;
            } else if (row[`output:${outputKey}`] === 'False') {
                value = false;
            } else if (!isNaN(row[`output:${outputKey}`])) {
                value = parseFloat(row[`output:${outputKey}`]);
            } else {
                value = row[`output:${outputKey}`];
            }

            outputs[outputKey] = value;
        });

        testCases.push({
            inputs,
            results: [
                {
                    outputs,
                    rowIndex: (index + 1).toString(),
                },
            ],
        });
    });

    const inputs = Object.keys(inputsMap).map((key) => ({
        key,
        values: Array.from(inputsMap[key]),
    }));

    return {
        data: {
            inputs,
            testCases,
            variables: [],
        },
        decisionId: decisionId,
        dmnPath: [dmnDecisionPath, dmnFile],
        isActive: 'true',
    };
}

// Process all CSV files in the directory
async function processCSVFiles(): Promise<void> {
    const files = fs.readdirSync(dmnCSVPath).filter(file => file.endsWith('.csv'));
    
    for (const file of files) {
        const filePath = path.join(dmnCSVPath, file);
        try {
            const decisionInfo = await getDecisionInfo(filePath);
            const rows = await parseCSV(filePath);
            const outputJSON = transformData(rows, decisionInfo.decisionId, decisionInfo.dmnFile);

            const outputFilePath = path.join(dmnConfigPath, file.replace('.csv', '.conf'));
            fs.writeFileSync(outputFilePath, JSON.stringify(outputJSON, null, 2));
            console.log(`Processed ${filePath} and saved to ${outputFilePath}`);
        } catch (error) {
            console.error(`Error processing ${filePath}: ${error}`);
        }
    }
}

// Entry point
const dmnConfigPath = 'dmnConfigs';
const dmnCSVPath = 'dmnCSV';   
const dmnDecisionPath = 'dmns';
const titleRowsCount = 2;
processCSVFiles()
    .then(() => {
        console.log('All files processed successfully.');
    })
    .catch((err) => {
        console.error('Error processing files:', err);
    });