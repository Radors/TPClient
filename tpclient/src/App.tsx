
import { Fragment, useState, useEffect } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfo, faPlay, faCircleMinus, faPlus, faSquarePollVertical, faXmark, faArrowLeft} from '@fortawesome/free-solid-svg-icons';

// An Array<FoodItem> will be received from the server, i.e. an array with elements of the following type:
interface FoodItem {
    id: number;
    name: string; // Original input just carried along (not the name of the matched item!)
    weight: number; // Grams with no (!) decimals
    // Nutrient percentages as a two-decimal-rounded "and ready" double (in TS a number), like 0.37 or 2.86 (!)
    jod: number;
    jarn: number;
    kalcium: number;
    kalium: number;
    magnesium: number;
    selen: number;
    zink: number;
    a: number;
    b1: number;
    b2: number;
    b3: number;
    b6: number;
    b9: number;
    b12: number;
    c: number;
    d: number;
    e: number;
}

//Here are some fake food items during development
const FakeFoodItem: FoodItem = {
    id: 0, name: "Lax", weight: 200,
    jod: 0.2,
    jarn: 0.5,
    kalcium: 0.3,
    kalium: 0.2,
    magnesium: 0.5,
    selen: 0.4,
    zink: 0.2,
    a: 0.6,
    b1: 0.1,
    b2: 0.3,
    b3: 0.2,
    b6: 0.5,
    b9: 0.4,
    b12: 0.3,
    c: 0.2,
    d: 0.4,
    e: 0.3,
}
const FakeFoodItem2: FoodItem = {
    id: 1, name: "Spenat", weight: 175,
    jod: 0.2,
    jarn: 0.5,
    kalcium: 0.3,
    kalium: 0.2,
    magnesium: 0.5,
    selen: 0.4,
    zink: 0.2,
    a: 0.6,
    b1: 0.1,
    b2: 0.3,
    b3: 0.2,
    b6: 0.5,
    b9: 0.4,
    b12: 0.3,
    c: 0.2,
    d: 0.4,
    e: 0.3,
}
const FakeFoodItem3: FoodItem = {
    id: 2, name: "Potatis", weight: 225,
    jod: 0.2,
    jarn: 0.5,
    kalcium: 0.3,
    kalium: 0.2,
    magnesium: 0.5,
    selen: 0.4,
    zink: 0.2,
    a: 0.6,
    b1: 0.1,
    b2: 0.3,
    b3: 0.2,
    b6: 0.5,
    b9: 0.4,
    b12: 0.3,
    c: 0.2,
    d: 0.4,
    e: 0.3,
}
// Here is the fake Array<FoodItem> used during development
const fakeFoods: Array<FoodItem> = [FakeFoodItem, FakeFoodItem2, FakeFoodItem3];

export default function App() {
    return (
        <div className="outermost">
            <div className="outermost-side">
                <div className="side-topbar-left">
                </div>
            </div>
            <FoodManager />
            <div className="outermost-side">
                <div className="side-topbar-right">
                </div>
            </div>
        </div>
    );
}

function FoodManager() {
    const startingPoint = [{ id: 0, matvara: "", customWeight: true, weight: 0 },
                           { id: 1, matvara: "", customWeight: true, weight: 0 },
                           { id: 2, matvara: "", customWeight: true, weight: 0 }]
    const [demo, setDemo] = useState(false);
    const [merInformation, setMerInformation] = useState(false);
    const [inputRows, setInputRows] = useState(startingPoint);
    const [onlyNumbersWarning, setOnlyNumbersWarning] = useState({active: false, index: 0});

    useEffect(() => {
        const finalValues = ["Torsk", "Potatis", "Hollandaisesås"];
        function updateCurrentValues() {
            const newInputRows = inputRows.slice();
            newInputRows[0].matvara = finalValues[0].slice(0, inputRows[0].matvara.length + 1);
            newInputRows[1].matvara = finalValues[1].slice(0, inputRows[1].matvara.length + 1);
            newInputRows[2].matvara = finalValues[2].slice(0, inputRows[2].matvara.length + 1);
            if (inputRows[2].matvara == finalValues[2]) {
                setDemo(false);
            }
            setInputRows(newInputRows);
        }

        let id: ReturnType<typeof setTimeout>;
        if (demo) {
            id = setTimeout(updateCurrentValues, 50);
        }

        return () => {
            clearTimeout(id);
        };
    }, [demo, inputRows]); /* ? */

    useEffect(() => {
        let id: ReturnType<typeof setTimeout>;
        if (onlyNumbersWarning.active) {
            id = setTimeout(() => { setOnlyNumbersWarning({ active: false, index: 0 }) }, 1500);
        }

        return () => {
            clearTimeout(id);
        }
    }, [onlyNumbersWarning]);



    function onStartDemonstration() {
        if (!demo) {
            const newInputRows = startingPoint;
            setInputRows(newInputRows);
            setDemo(true);
        }
    }

    function onInputToMatvara(event: React.ChangeEvent<HTMLInputElement>, index: number) {
        const newInputRows = inputRows.slice();
        newInputRows[index].matvara = event.target.value;
        setInputRows(newInputRows);
    }

    function onInputToWeight(event: React.ChangeEvent<HTMLInputElement>, index: number) {
        if (event.target.value == "") {
            const newInputRows = inputRows.slice();
            newInputRows[index].weight = 0;
            setInputRows(newInputRows);
            return;
        } 

        const isInteger = /^\d+$/.test(event.target.value);
        if (isInteger) {
            const value = Number(event.target.value);

            if (value > -1) {
                const newInputRows = inputRows.slice();
                newInputRows[index].weight = value;
                setInputRows(newInputRows);
            }
        } else {
            setOnlyNumbersWarning({ active: true, index: index });
        }
    }

    function onToggleMerInformation() {
        setMerInformation(!merInformation);
    }

    function onToggleCustomWeights(index: number) {
        const newInputRows = inputRows.slice();
        newInputRows[index].customWeight = !newInputRows[index].customWeight;
        setInputRows(newInputRows);
    }

    function onAddInputRow() {
        const newInputRows = inputRows.slice();
        newInputRows.push({ id: (newInputRows[newInputRows.length - 1].id + 1), matvara: "", customWeight: true, weight: 0 });
        setInputRows(newInputRows);
    }

    function onRemoveInputRow(index: number) {
        const newInputRows = inputRows.slice();
        newInputRows.splice(index, 1);
        setInputRows(newInputRows);
    }

    return (
        <div className="food-manager">
            <TopBar onStartDemonstration={onStartDemonstration} onToggleMerInformation={onToggleMerInformation} />
            <FoodMain onlyNumbersWarning={onlyNumbersWarning} onInputToWeight={onInputToWeight} onToggleCustomWeights={onToggleCustomWeights} onAddInputRow={onAddInputRow} onRemoveInputRow={onRemoveInputRow} inputRows={inputRows} merInformation={merInformation} onInputToMatvara={onInputToMatvara} onToggleMerInformation={onToggleMerInformation} />
        </div>
    );
}

function TopBar({ onStartDemonstration, onToggleMerInformation }: { onStartDemonstration: () => void, onToggleMerInformation: () => void}) {
    return (
        <div className="top-bar">
            <div className="top-bar-inner">
                <button className="demonstration" onClick={onStartDemonstration}>
                    <FontAwesomeIcon size="sm" className="play-icon" icon={faPlay} />Demonstration
                </button>
                <button className="mer-information" onClick={onToggleMerInformation}>
                    <FontAwesomeIcon size="sm" className="info-icon" icon={faInfo} />
                    Mer information
                </button>
            </div>
        </div>
    );
}

function FoodMain({ onlyNumbersWarning, onInputToWeight, inputRows, merInformation, onInputToMatvara, onToggleMerInformation, onToggleCustomWeights, onAddInputRow, onRemoveInputRow }: { onlyNumbersWarning: { active: boolean, index: number }, onInputToWeight: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void ,onToggleCustomWeights: (index: number) => void, onAddInputRow: () => void, onRemoveInputRow: (index: number) => void, inputRows: Array<{id: number, matvara: string, customWeight: boolean, weight: number}>, merInformation: boolean, onInputToMatvara: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void, onToggleMerInformation: () => void }) {
    return (
        <div className="food-main">
            <div className="food-main-left">
                <FoodInput onlyNumbersWarning={onlyNumbersWarning} onInputToWeight={onInputToWeight} onToggleCustomWeights={onToggleCustomWeights} onAddInputRow={onAddInputRow} onRemoveInputRow={onRemoveInputRow} inputRows={inputRows} merInformation={merInformation} onInputToMatvara={onInputToMatvara} onToggleMerInformation={onToggleMerInformation} />
            </div>
            <div className="food-main-divider">
            </div>
            <div className="food-main-right">
                <FoodOutput />
            </div>
        </div>
    );
}

function FoodInput({ onlyNumbersWarning, onInputToWeight, inputRows, merInformation, onInputToMatvara, onToggleMerInformation, onToggleCustomWeights, onAddInputRow, onRemoveInputRow }: { onlyNumbersWarning: { active: boolean, index: number }, onInputToWeight: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void, onToggleCustomWeights: (index: number) => void, onAddInputRow: () => void, onRemoveInputRow: (index: number) => void, inputRows: Array<{ id: number, matvara: string, customWeight: boolean, weight: number }>, merInformation: boolean, onInputToMatvara: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void, onToggleMerInformation: () => void }) {
    return (
        <div className="food-input">
            <div className="mer-information-outer"
            style={{
                display: merInformation ? "flex" : "none",
            }}>
                <div className="mer-information-container">
                    <div className="mer-information-left"></div>
                    <div className="mer-information-right">
                        <button className="remove-mer-information" onClick={onToggleMerInformation}>
                            <FontAwesomeIcon icon={faXmark} size="lg" />
                        </button>
                    </div>
                </div>
            </div>
            <div className="food-input-grid">
                <div className="food-input-heading-container">Matvara <br /> (exempelvis Lax)</div>
                <div className="food-input-heading-container">Uppskatta<br />vikt med AI</div>
                <div className="food-input-heading-container">Vikt<br />(antal gram)</div>
                <div className="food-input-heading-container"
                    style={{
                        opacity: `${inputRows.length == 1 ? "30%" : "100%"}`,
                    }}>
                    Ta bort<br />matvara
                </div>
                <FoodInputRows onlyNumbersWarning={onlyNumbersWarning} onInputToWeight={onInputToWeight} onInputToMatvara={onInputToMatvara} inputRows={inputRows} onToggleCustomWeights={onToggleCustomWeights} onRemoveInputRow={onRemoveInputRow} /> 
            </div>
            <button className="lagg-till-fler" onClick={onAddInputRow}>
                <FontAwesomeIcon size="lg" className="plus-icon" icon={faPlus} />Lägg till fler
            </button>
            <button className="generera-resultat">
                <FontAwesomeIcon className="resultat-icon" size="xl" icon={faSquarePollVertical} />
                Generera resultat
            </button>
        </div>
    );
}

function FoodInputRows({ onlyNumbersWarning, onInputToWeight, onToggleCustomWeights, onRemoveInputRow, inputRows, onInputToMatvara }: { onlyNumbersWarning: { active: boolean, index: number }, onInputToWeight: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void, onToggleCustomWeights: (index: number) => void, onRemoveInputRow: (index: number) => void, inputRows: Array<{ id: number, matvara: string, customWeight: boolean, weight: number }>, onInputToMatvara: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void }) {
    const content = inputRows.map((row: { id: number, matvara: string, customWeight: boolean, weight: number }, index: number) => (
        <Fragment key={row.id}>
            <input className="matvara" type="text" value={row.matvara} onChange={(event) => onInputToMatvara(event, index)} placeholder="Matvara" />
            <input className="uppskatta-vikt" type="checkbox" checked={!row.customWeight} onChange={() => onToggleCustomWeights(index)} />
            <div className="antal-gram-outer"
                style={{
                    display: row.customWeight ? "flex" : "none",
                }}
            >
                <input className="vikt-antal-gram" type="text" value={row.weight == 0 ? "" : row.weight} onChange={(event) => onInputToWeight(event, index)}/>
                <div className="only-numbers-warning-container"
                    style={{
                        display: (onlyNumbersWarning.active && onlyNumbersWarning.index == index) ? "flex" : "none",
                    }}
                >
                    Endast siffror!
                </div>
            </div>
            <FontAwesomeIcon icon={faArrowLeft} className="antal-gram-arrow-left" size="lg"
                style={{
                    display: `${row.customWeight ? "none" : "flex"}`,
            }}/>
            <button className="ta-bort" onClick={() => onRemoveInputRow(index)}
                style={{
                    visibility: `${inputRows.length == 1 ? "hidden" : "visible"}`,
            }}>
                <FontAwesomeIcon size="lg" icon={faCircleMinus} />
            </button>
        </Fragment>
    ));

    return (
        <>
            {content}
        </>
    );
}

function FoodOutput() {
    const [itemVisibility, setItemVisibility] = useState(Array(3).fill(true));
    const [showGuidelines, setShowGuidelines] = useState(false);

    function onToggleVisibility(id: number) {
        const newItemVisibility = itemVisibility.slice();
        newItemVisibility[id] = !newItemVisibility[id];
        setItemVisibility(newItemVisibility);
    }

    function onToggleGuidelines() {
        setShowGuidelines(!showGuidelines);
    }

    return (
        <>
            <div className="food-output">
                <FoodGraph itemVisibility={itemVisibility} showGuidelines={showGuidelines} />
                <FoodLegend itemVisibility={itemVisibility} onToggleVisibility={onToggleVisibility} onToggleGuidelines={onToggleGuidelines} showGuidelines={showGuidelines} />
            </div>
        </>
    );
}

function FoodGraph({ itemVisibility, showGuidelines }: { itemVisibility: Array<boolean>, showGuidelines: boolean}) {
    const nutrientPropertyKeys: Array<keyof FoodItem> = ["jod", "jarn", "kalcium", "kalium", "magnesium", "selen", "zink",
        "a", "b1", "b2", "b3", "b6", "b9", "b12", "c", "d", "e"];
    const nutrientLabels: Array<string> = ["Jod", "Järn", "Kalcium", "Kalium", "Magnesium", "Selen", "Zink", 
        "A", "B1", "B2", "B3", "B6", "B9", "B12", "C", "D", "E"];

    const allBars = nutrientPropertyKeys.map((property: keyof FoodItem, index: number) => (
        <FoodGraphCanvasBarContainer key={index} itemVisibility={itemVisibility} nutrientProperty={property} foodItems={fakeFoods} />
    ));

    const allLabels = nutrientLabels.map((label: string, index: number) => (
        <FoodGraphNutrientsContainer key={index} isMineral={(index<7) ? true : false} nutrient={label} />
    ));

    return (
        <div className="food-graph">
            <div className="food-graph-canvas-limit-bar">
            </div>
            <div className="food-graph-canvas"> 
                {allBars}
            </div>
            <div className="food-graph-canvas-limit-bar"></div>
            <div className="food-graph-guideline upperguide" style={{ visibility: `${showGuidelines ? "visible" : "hidden" }`}}></div>
            <div className="food-graph-guideline midguide"></div>
            <div className="food-graph-guideline lowerguide" style={{ visibility: `${showGuidelines ? "visible" : "hidden"}` }}></div>
            <div className="food-graph-twohundred">200%</div>
            <div className="food-graph-hundredfifty" style={{ visibility: `${showGuidelines ? "visible" : "hidden"}` }}>150%</div>
            <div className="food-graph-rdi">RDI</div>
            <div className="food-graph-fifty" style={{ visibility: `${showGuidelines ? "visible" : "hidden"}` }}>50%</div>
            <div className="food-graph-nutrients-outer">
                {allLabels}
            </div>
        </div>
    );
}

function FoodGraphNutrientsContainer({ isMineral, nutrient}: { isMineral: boolean; nutrient: string}) {
    return (
        <div className={isMineral ? "mineral-text-container" : "vitamin-text-container"} >
            <div className={isMineral ? "mineral-text" : "vitamin-text"}>
                {nutrient}
            </div>
        </div>
    );
}

const barColors: Array<string> = ["#1F77B4", "#FF7F0E", "#2CA02C", "#D62728", "#9467BD", "#8C564B",
            "#E377C2", "#BCBD22", "#17BECF", "#AEC7E8", "#FFBB78", "#98DF8A", "#FF9896", "#C5B0D5"];

function FoodGraphCanvasBarContainer({ nutrientProperty, foodItems, itemVisibility }: { nutrientProperty: keyof FoodItem, foodItems: Array<FoodItem>, itemVisibility: Array<boolean>}) {
    const content = foodItems.map((item: FoodItem, index: number) => (
        <div key={index} className="food-graph-canvas-bar"
            style={{
                backgroundColor: `${barColors[index]}`,
                height: `${(item[nutrientProperty]) as number * 150}px`, // 150 instead of 300 since full height means 200%
                display: itemVisibility[index] ? "flex" : "none",
            }}>
        </div>
    ));

    return (
        <div className="food-graph-canvas-bar-container">
            {content}
        </div>
    );
}


function FoodLegend({ itemVisibility, onToggleVisibility, onToggleGuidelines, showGuidelines }: { itemVisibility: Array<boolean>, onToggleVisibility: (id: number) => void, onToggleGuidelines: () => void, showGuidelines: boolean }) {
    const allLegends = fakeFoods.map((item: FoodItem, index: number) => (
        <div key={index} className="food-legend-and-switch">
            <div className="food-legend-container">
                <div className="food-legend-container-left">
                    <div className="food-legend-colormark-outer">
                        <div className="food-legend-colormark"
                            style={{
                                backgroundColor: `${barColors[index]}`
                            }}
                        ></div>
                    </div>
                    <div className="food-legend-label">
                        {item.name}
                    </div>
                </div>
                <div className="food-legend-container-right">
                    {`${item.weight} g`}
                </div>
            </div>
            <div className="switch-container">
                <label className="switch">
                    <input type="checkbox" checked={itemVisibility[index]} onChange={() => onToggleVisibility(index)} />
                    <span className="slider round" />
                </label>
            </div>
        </div>
    ));

    return (
        <div className="food-legend-outer">
            <div className="food-legend-toprow">
                <div className="switch-container">
                    <label className="switch">
                        <input type="checkbox" checked={showGuidelines} onChange={onToggleGuidelines} />
                        <span className="slider round" />
                    </label>
                </div>
                <div className="fler-stodlinjer">
                    Fler stödlinjer
                </div>
            </div>
            <div className="visa-outer">
                <div className="visa-container">
                    Visa
                </div>
            </div>
            {allLegends}
        </div>
    );
}