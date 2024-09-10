import { Fragment, useState, useEffect, useCallback } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfo, faPlay, faCircleMinus, faPlus, faSquarePollVertical, faXmark, } from '@fortawesome/free-solid-svg-icons';

// Array<FoodInput> will be SENT to the server.
interface FoodInput {
    frontendId: number;
    name: string;
}

// Array<FoodProduct> will be RECEIVED from the server.
interface FoodProduct {
    frontendId: number;
    name: string; // Original input carried along / brought back ( not the name of any matched item(s) )
    rejected: boolean;
    // Nutrient percentages as decimal points
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
    const startingPoint = [{ id: 0, matvara: ""},
                           { id: 1, matvara: ""},
                           { id: 2, matvara: ""}]
    const [inputRows, setInputRows] = useState(startingPoint);

    const [demo, setDemo] = useState(false);
    const [merInformation, setMerInformation] = useState(false);
    const [onlyNumbersWarning, setOnlyNumbersWarning] = useState({ active: false, index: 0 });
    const [isRequesting, setIsRequesting] = useState(false);
    const [foodAggregations, setFoodAggregations] = useState(Array<FoodProduct>);

    const onGenerateResults = useCallback(async () => {
        if (isRequesting) return;
        setIsRequesting(true);

        const url = "https://tp-api.salmonwave-4f8bbb94.swedencentral.azurecontainerapps.io/food/processinput";
        const foodInputs: Array<FoodInput> = inputRows.filter(row => row.matvara !== "").map((row: { id: number, matvara: string}) => {
            const foodInput: FoodInput = { frontendId: row.id, name: row.matvara};
            return foodInput;
        });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(foodInputs)
            });

            if (response.ok) {
                const receivedFoodAggregations: Array<FoodProduct> = await response.json();
                setFoodAggregations(receivedFoodAggregations);
            }
        } catch {
            console.log("placeholder");
        }
        finally {
            setIsRequesting(false);
        }
    }, [isRequesting, inputRows]);

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
    }, [demo, inputRows]);

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

    function onToggleMerInformation() {
        setMerInformation(!merInformation);
    }

    function onAddInputRow() {
        const newInputRows = inputRows.slice();
        newInputRows.push({ id: (newInputRows[newInputRows.length - 1].id + 1), matvara: ""});
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
            <FoodMain inputRows={inputRows}
                onAddInputRow={onAddInputRow}
                onRemoveInputRow={onRemoveInputRow} 
                merInformation={merInformation}
                onInputToMatvara={onInputToMatvara}
                onToggleMerInformation={onToggleMerInformation} 
                foodAggregations={foodAggregations}
                onGenerateResults={onGenerateResults}
            />
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

function FoodMain({inputRows, onAddInputRow, onRemoveInputRow,
    onInputToMatvara, merInformation, onToggleMerInformation, foodAggregations, onGenerateResults }:
    {
        inputRows: Array<{ id: number, matvara: string}>,
        onAddInputRow: () => void,
        onRemoveInputRow: (index: number) => void,
        onInputToMatvara: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void,
        merInformation: boolean,
        onToggleMerInformation: () => void,
        foodAggregations: Array<FoodProduct>
        onGenerateResults: () => void,
    }) {
    return (
        <div className="food-main">
            <div className="food-main-left">
                <FoodInput
                    onAddInputRow={onAddInputRow} onRemoveInputRow={onRemoveInputRow} inputRows={inputRows} merInformation={merInformation}
                    onInputToMatvara={onInputToMatvara} onToggleMerInformation={onToggleMerInformation} onGenerateResults={onGenerateResults} />
            </div>
            <div className="food-main-divider">
            </div>
            <div className="food-main-right">
                <FoodOutput foodAggregations={foodAggregations} />
            </div>
        </div>
    );
}

function FoodInput({ inputRows, onAddInputRow, onRemoveInputRow,
    onInputToMatvara, merInformation, onToggleMerInformation, onGenerateResults }:
    {
        inputRows: Array<{ id: number, matvara: string}>,
        onAddInputRow: () => void,
        onRemoveInputRow: (index: number) => void,
        onInputToMatvara: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void,
        merInformation: boolean,
        onToggleMerInformation: () => void,
        onGenerateResults: () => void,
    }) {
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
                <div className="food-input-heading-container"
                    style={{
                        opacity: `${inputRows.length == 1 ? "30%" : "100%"}`,
                    }}>
                    Ta bort<br />matvara
                </div>
                <FoodInputRows onInputToMatvara={onInputToMatvara}
                    inputRows={inputRows} onRemoveInputRow={onRemoveInputRow} />
                <button className="lagg-till-fler" onClick={onAddInputRow}>
                    <FontAwesomeIcon size="lg" className="plus-icon" icon={faPlus} />Lägg till fler
                </button>
            </div>
            <button className="generera-resultat" onClick={onGenerateResults}>
                <FontAwesomeIcon className="resultat-icon" size="xl" icon={faSquarePollVertical} />
                Generera resultat
            </button>
        </div>
    );
}

function FoodInputRows({ onRemoveInputRow, inputRows, onInputToMatvara }:
    {
        onRemoveInputRow: (index: number) => void,
        inputRows: Array<{ id: number, matvara: string}>,
        onInputToMatvara: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void
    }) {
    const content = inputRows.map((row: { id: number, matvara: string}, index: number) => (
        <Fragment key={row.id}>
            <input className="matvara" type="text" value={row.matvara} onChange={(event) => onInputToMatvara(event, index)} placeholder="Matvara" />
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

function FoodOutput({ foodAggregations }: { foodAggregations: Array<FoodProduct>}) {
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
                <FoodGraph itemVisibility={itemVisibility} showGuidelines={showGuidelines} foodAggregations={foodAggregations} />
                <FoodLegend itemVisibility={itemVisibility} onToggleVisibility={onToggleVisibility}
                    onToggleGuidelines={onToggleGuidelines} showGuidelines={showGuidelines} foodAggregations={foodAggregations} />
            </div>
        </>
    );
}

function FoodGraph({ itemVisibility, showGuidelines, foodAggregations }: { itemVisibility: Array<boolean>, showGuidelines: boolean, foodAggregations: Array<FoodProduct>}) {
    const nutrientPropertyKeys: Array<keyof FoodProduct> = ["jod", "jarn", "kalcium", "kalium", "magnesium", "selen", "zink",
        "a", "b1", "b2", "b3", "b6", "b9", "b12", "c", "d", "e"];
    const nutrientLabels: Array<string> = ["Jod", "Järn", "Kalcium", "Kalium", "Magnesium", "Selen", "Zink", 
        "A", "B1", "B2", "B3", "B6", "B9", "B12", "C", "D", "E"];

    const allBars = nutrientPropertyKeys.map((property: keyof FoodProduct, index: number) => (
        <FoodGraphCanvasBarContainer key={index} itemVisibility={itemVisibility} nutrientProperty={property} foodItems={foodAggregations} />
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

function FoodGraphCanvasBarContainer({ nutrientProperty, foodItems, itemVisibility }:
    {
        nutrientProperty: keyof FoodProduct,
        foodItems: Array<FoodProduct>,
        itemVisibility: Array<boolean>
    }) {
    const content = foodItems.map((item: FoodProduct, index: number) => (
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


function FoodLegend({ itemVisibility, onToggleVisibility, onToggleGuidelines, showGuidelines, foodAggregations }:
    {
        itemVisibility: Array<boolean>,
        onToggleVisibility: (id: number) => void,
        onToggleGuidelines: () => void,
        showGuidelines: boolean,
        foodAggregations: Array<FoodProduct>
    }) {
    const allLegends = foodAggregations.map((item: FoodProduct, index: number) => (
        <div key={index} className="food-legend-and-switch">
            <div className="food-legend-container">
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