import { Fragment, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfo, faPlay, faPlus, faSquarePollVertical, faXmark, faArrowRight, faArrowLeft, faCircleXmark, faMinimize, faCircleCheck, } from '@fortawesome/free-solid-svg-icons';
import { useMediaQuery } from 'react-responsive'

// Array<FoodProduct> will be RECEIVED from the server.
interface FoodProduct {
    query: string;
    frontendId: number;
    name: string;
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

interface InputRow {
    id: number;
    query: string;
    active: boolean;
    hasDecided: boolean;
    decision: FoodProduct | null;
}

enum SearchType {
    Basic,
    Embeddings
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
    const startingPoint = [{ id: 0, query: "", active: false, hasDecided: false, decision: null },
                           { id: 1, query: "", active: false, hasDecided: false, decision: null },
                           { id: 2, query: "", active: false, hasDecided: false, decision: null }]
    const [inputRows, setInputRows] = useState<InputRow[]>(startingPoint);
    const [displayedInputRows, setDisplayedInputRows] = useState<InputRow[]>([]);
    const [itemVisibility, setItemVisibility] = useState<boolean[]>([]);
    const [merInformation, setMerInformation] = useState(false);
    const [foodProducts, setFoodProducts] = useState<{ products: FoodProduct[]; id: number }>({ products: [], id: -1 });
    const [foodProductsFromEmbeddings, setFoodProductsFromEmbeddings] = useState<{ products: FoodProduct[]; id: number }>({ products: [], id: -1 });
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const foodProductsRef = useRef(foodProducts);
    foodProductsRef.current = foodProducts;

    const activeInput = useMemo(() => {
        const inputRow = inputRows.find(e => e.active);
        return { query: inputRow?.query, id: inputRow?.id };
    }, [inputRows]);

    const fetchData = useCallback(async (activeRow: { id: number, query: string, active: boolean }, searchType: SearchType) => {
        class TimeoutError extends Error {
            constructor(message = "Request timed out") {
                super(message);
                this.name = "TimeoutError";
            }
        }
        async function fetchWithTimeout(url: string, options = {}, timeout = 2000): Promise<Response> {
            const controller = new AbortController();
            const { signal } = controller;
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            try {
                const response = await fetch(url, { ...options, signal });

                clearTimeout(timeoutId);
                return response;

            } catch (error) {
                clearTimeout(timeoutId);

                if (error instanceof DOMException && error.name === "AbortError") {
                    throw new TimeoutError;
                }
                throw error;
            }
        }
        const urlBase = "https://tp-api.salmonwave-4f8bbb94.swedencentral.azurecontainerapps.io/food/search/";
        const urlChoice = (searchType === SearchType.Basic) ? "basic" : "embeddings";
        try {
            const response = await fetchWithTimeout(`${urlBase}${urlChoice}?query=${activeRow.query}&frontendid=${activeRow.id}`);

            if (response.ok) {
                const items: FoodProduct[] = await response.json();
                if (searchType === SearchType.Basic) {
                    setFoodProducts({ products: items, id: activeRow.id });
                }
                else if (searchType === SearchType.Embeddings) {
                    const firstEightBasicsNames = foodProductsRef.current.products.slice(0, 8).map(product => product.name.toLowerCase());
                    const newItems = items.filter(item => {
                        return !firstEightBasicsNames.includes(item.name.toLowerCase());
                    });
                    setFoodProductsFromEmbeddings({ products: newItems, id: activeRow.id });
                }
            } else {
                switch (response.status) {
                    case 400:
                        console.error("The request returned: 400 Bad Request");
                        // Should never be possible for legitimate users of the UI
                        break;
                    case 503:
                        console.error("The request returned: 503 Service Unavailable");
                        // Retry and/or inform
                        break;
                    default:
                        console.error(`The request resulted in an unexpected status code: ${response.status}`);
                        // The server only responds with 200, 400, 503.
                        break;
                }
            }
        } catch (error: unknown) {
            if (error instanceof TimeoutError) {
                console.error("TimeoutError");
                // Retry and/or inform
            } else {
                console.error("Unexpected error:", error);
                // Retry and/or inform
            }
        }
    }, []);

    useEffect(() => {
        if (typeof activeInput.query === "string" && activeInput.query.trim() !== "") {
            const query = activeInput.query;
            const handler = setTimeout(() => {
                setDebouncedQuery(query);
            }, 270);

            return () => {
                clearTimeout(handler);
            };
        }
    }, [activeInput.query, activeInput.id]);

    useEffect(() => {
        if (debouncedQuery !== "") {
            const activeRow = inputRows.find(e => e.active);
            if (activeRow && activeRow.query === debouncedQuery) {
                setDebouncedQuery("");
                fetchData(activeRow, SearchType.Basic);
                fetchData(activeRow, SearchType.Embeddings);
            }
        }
    }, [debouncedQuery, fetchData, inputRows]);


    function onToggleVisibility(index: number) {
        const newItemVisibility = itemVisibility.slice();
        newItemVisibility[index] = !newItemVisibility[index];
        setItemVisibility(newItemVisibility);
    }

    function onDisplayNutrition() {
        const inputRowsDecided = inputRows.filter(e => e.hasDecided && e.decision);
        if (inputRowsDecided.length < 1) {
            return; // Inform the user
        }
        setDisplayedInputRows(inputRowsDecided);
        setItemVisibility(Array(inputRowsDecided.length).fill(true));
    }

    function onSelectFoodProduct(product: FoodProduct) {
        const newInputRows = inputRows.map(item =>
            item.id === product.frontendId
                ? { ...item, active: false, hasDecided: true, decision: product }
                : { ...item, active: false }
        );
        setInputRows(newInputRows);
    }

    function onSetActive(id: number) {
        const newInputRows = inputRows.map(item =>
            item.id === id
            ? { ...item, active: true }
            : { ...item, active: false }
        );
        setInputRows(newInputRows);
    }

    function onHideActive() {
        const newInputRows = inputRows.map(item =>
            ({ ...item, active: false })
        );
        setInputRows(newInputRows);
    }

    function onInputToMatvara(event: React.ChangeEvent<HTMLInputElement>, id: number) {
        const newInputRows = inputRows.map(item =>
            item.id === id
            ? { ...item, active: true, query: event.target.value }
            : { ...item, active: false }
        );
        setInputRows(newInputRows);
    }

    function onToggleMerInformation() {
        setMerInformation(!merInformation);
    }

    function onAddInputRow() {
        const newInputRows = inputRows.slice();
        newInputRows.push({ id: (newInputRows[newInputRows.length - 1].id + 1), query: "", active: false, hasDecided: false, decision: null });
        setInputRows(newInputRows);
    }

    function onRemoveInputRow(id: number) {
        const newInputRows = inputRows.filter(e => e.id != id);
        setInputRows(newInputRows);
    }

    return (
        <div className="food-manager">
            <TopBar onToggleMerInformation={onToggleMerInformation} />
            <FoodMain inputRows={inputRows}
                onAddInputRow={onAddInputRow}
                onRemoveInputRow={onRemoveInputRow}
                merInformation={merInformation}
                onInputToMatvara={onInputToMatvara}
                onToggleMerInformation={onToggleMerInformation}
                onSetActive={onSetActive}
                foodProducts={foodProducts}
                foodProductsFromEmbeddings={foodProductsFromEmbeddings}
                onHideActive={onHideActive}
                onSelectFoodProduct={onSelectFoodProduct}
                onDisplayNutrition={onDisplayNutrition}
                displayedInputRows={displayedInputRows}
                itemVisibility={itemVisibility}
                onToggleVisibility={onToggleVisibility}
            />
        </div>
    );
}

function TopBar({ onToggleMerInformation }: { onToggleMerInformation: () => void}) {
    return (
        <div className="top-bar">
            <div className="top-bar-inner">
                <button className="demonstration">
                    <FontAwesomeIcon size="sm" className="play-icon" icon={faPlay} />
                    Unnamed thing
                </button>
                <button className="mer-information" onClick={onToggleMerInformation}>
                    <FontAwesomeIcon size="sm" className="info-icon" icon={faInfo} />
                    Mer information
                </button>
            </div>
        </div>
    );
}

function FoodMain({ inputRows, onAddInputRow, onRemoveInputRow, onInputToMatvara,
    merInformation, onToggleMerInformation, onSetActive, foodProducts, foodProductsFromEmbeddings,
    onHideActive, onSelectFoodProduct, onDisplayNutrition, displayedInputRows, itemVisibility, onToggleVisibility }:
    {
        inputRows: Array<{ id: number, query: string, active: boolean, hasDecided: boolean, decision: FoodProduct | null }>,
        onAddInputRow: () => void,
        onRemoveInputRow: (index: number) => void,
        onInputToMatvara: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void,
        merInformation: boolean,
        onToggleMerInformation: () => void,
        onSetActive: (id: number) => void,
        foodProducts: { products: Array<FoodProduct>; id: number },
        foodProductsFromEmbeddings: { products: Array<FoodProduct>; id: number },
        onHideActive: () => void,
        onSelectFoodProduct: (product: FoodProduct) => void,
        onDisplayNutrition: () => void,
        displayedInputRows: InputRow[],
        itemVisibility: boolean[],
        onToggleVisibility: (index: number) => void
    }) {
    return (
        <div className="food-main">
            <div className="food-main-left">
                <FoodInputOuter
                    onAddInputRow={onAddInputRow} onRemoveInputRow={onRemoveInputRow} inputRows={inputRows} merInformation={merInformation}
                    onInputToMatvara={onInputToMatvara} onToggleMerInformation={onToggleMerInformation}
                    onSetActive={onSetActive} foodProducts={foodProducts} foodProductsFromEmbeddings={foodProductsFromEmbeddings}
                    onHideActive={onHideActive} onSelectFoodProduct={onSelectFoodProduct} onDisplayNutrition={onDisplayNutrition}
                />
            </div>
            <div className="food-main-divider">
            </div>
            <div className="food-main-right">
                <FoodOutput displayedInputRows={displayedInputRows} itemVisibility={itemVisibility} onToggleVisibility={onToggleVisibility} />
            </div>
        </div>
    );
}

function FoodInputOuter({ inputRows, onAddInputRow, onRemoveInputRow, onInputToMatvara,
    merInformation, onToggleMerInformation, onSetActive, foodProducts, foodProductsFromEmbeddings, 
    onHideActive, onSelectFoodProduct, onDisplayNutrition }:
    {
        inputRows: Array<{ id: number, query: string, active: boolean, hasDecided: boolean, decision: FoodProduct | null }>,
        onAddInputRow: () => void,
        onRemoveInputRow: (index: number) => void,
        onInputToMatvara: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void,
        merInformation: boolean,
        onToggleMerInformation: () => void,
        onSetActive: (id: number) => void,
        foodProducts: { products: Array<FoodProduct>; id: number },
        foodProductsFromEmbeddings: { products: Array<FoodProduct>; id: number },
        onHideActive: () => void,
        onSelectFoodProduct: (product: FoodProduct) => void,
        onDisplayNutrition: () => void
    }) {
    return (
        <div className="food-input">
            <div className="mer-information-outer"
            style={{
                display: merInformation ? "flex" : "none",
            }}>
                <div className="mer-information-container">
                    <div className="mer-information-inner">

                    </div>
                    <button className="click-to-hide hide-information" onClick={onToggleMerInformation}>
                        <FontAwesomeIcon icon={faXmark} size="lg" />
                    </button>
                </div>
            </div>
            <div className="food-inputs-column-outer">

                <FoodInputs onInputToMatvara={onInputToMatvara} inputRows={inputRows} onRemoveInputRow={onRemoveInputRow}
                    onSetActive={onSetActive} foodProducts={foodProducts} foodProductsFromEmbeddings={foodProductsFromEmbeddings}
                    onHideActive={onHideActive} onSelectFoodProduct={onSelectFoodProduct} />

                <div className="lagg-till-fler-outer">
                    <button className="lagg-till-fler" onClick={onAddInputRow}>
                        <FontAwesomeIcon size="lg" className="plus-icon" icon={faPlus} />
                        Lägg till fler
                    </button>
                </div>
                <button className="generera-resultat" onClick={onDisplayNutrition} >
                    <FontAwesomeIcon className="resultat-icon" size="xl" icon={faSquarePollVertical} />
                    Visa näringsvärden
                </button>
            </div>
        </div>
    );
}

function FoodInputs({ onRemoveInputRow, inputRows, onInputToMatvara, onSetActive, foodProducts, foodProductsFromEmbeddings, onHideActive, onSelectFoodProduct }:
    {
        onRemoveInputRow: (index: number) => void,
        inputRows: Array<{ id: number, query: string, active: boolean, hasDecided: boolean, decision: FoodProduct | null }>,
        onInputToMatvara: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void,
        onSetActive: (id: number) => void,
        foodProducts: { products: Array<FoodProduct>; id: number },
        foodProductsFromEmbeddings: { products: Array<FoodProduct>; id: number },
        onHideActive: () => void,
        onSelectFoodProduct: (product: FoodProduct) => void
    }) {
    const content = inputRows.map((row: { id: number, query: string, active: boolean, hasDecided: boolean, decision: FoodProduct | null}) => (
        <Fragment key={row.id}> 
            <div className="food-item-column"
                style={{
                    border: row.active ? "1px solid lightgray" : "none",
                }}>
                <div className="food-item-upper-permanent-container">
                    <div className="food-item-upper-permanent">
                        <input className="matvara" type="text" value={row.query} onChange={(event) => onInputToMatvara(event, row.id)} onClick={() => onSetActive(row.id)} placeholder="Matvara" />
                        <button className="ta-bort" onClick={() => onRemoveInputRow(row.id)}
                            style={{
                                visibility: inputRows.length === 1 ? "hidden" : "visible",
                            }}>
                            <FontAwesomeIcon size="xl" icon={faCircleXmark} />
                        </button>
                        <div className="decision-display" style={{
                                display: row.hasDecided ? "flex" : "none"
                            }}>
                            <FontAwesomeIcon icon={faCircleCheck} className="decision-display-icon" size="lg" />
                            <div className="decision-display-text">
                                {row.hasDecided && (row.decision) && (
                                    `${row.decision.name.slice(0, 42)}${row.decision.name.length > 42 ? "..." : ""}`
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="food-input-activated"
                    style={{
                        display: row.active ? 'flex' : 'none',
                    }}>
                    <div className="search-results-splitter">
                        <SearchResults title="Sökresultat" items={foodProducts} activeId={row.id} onSelectFoodProduct={onSelectFoodProduct} />
                        <SearchResults title="Liknande resultat" items={foodProductsFromEmbeddings} activeId={row.id} onSelectFoodProduct={onSelectFoodProduct} />
                    </div>
                    <button className="click-to-hide hide-active" onClick={onHideActive}>
                        <FontAwesomeIcon icon={faMinimize} size="lg" className="hide-active-icon" />
                    </button>
                </div>
            </div>
        </Fragment>
    ));

    return (
        <>
            {content}
        </>
    );
}

function SearchResults({ title, items, activeId, onSelectFoodProduct }:
    {
        title: string,
        items: { products: Array<FoodProduct>; id: number },
        activeId: number,
        onSelectFoodProduct: (product: FoodProduct) => void
    }) {
    const [startIndex, setStartIndex] = useState(0);
    const itemsPerPage = 8;

    function onNextPage() {
        if ((startIndex + itemsPerPage) < items.products.length) {
            setStartIndex(startIndex + itemsPerPage)
        }
    }
    function onPreviousPage() {
        if ((startIndex - itemsPerPage) >= 0) {
            setStartIndex(startIndex - itemsPerPage)
        }
    }

    const isLoading = (items.id !== activeId);

    useEffect(() => {
        if (isLoading) {
            setStartIndex(0);
        }
    }, [isLoading]);

    const verySmallScreen = useMediaQuery({ maxWidth: 420 });
    const smallScreen = useMediaQuery({ maxWidth: 470 });

    const visibleItems = items.products.slice(startIndex, (startIndex + itemsPerPage));

    const results = visibleItems.map((item: FoodProduct, index: number) => {
        if (isLoading) {
            return;
        }
        return (
            <div key={index} className="search-item" onClick={() => onSelectFoodProduct(item)}>
                <p className="search-item-paragraph">
                    {item.name.slice(0, verySmallScreen ? 50 : (smallScreen ? 60 : 70))}
                </p>
            </div>
        );
    });
    return (
        <div className="search-results"> 
            <div className="search-results-title">{title}</div>
            <div className="search-items-container">
                {results}
            </div>
            {!isLoading && (
                <div className="select-page"
                    style={{
                        display: items.products.length > 8 ? "flex" : "none"
                    }}>
                    <button className="select-page-button" onClick={onPreviousPage}
                        style={{
                            backgroundColor: startIndex > 0 ? "black" : "rgb(230, 230, 230)"
                    }}>
                        <FontAwesomeIcon icon={faArrowLeft} className="select-page-icon" />
                    </button>
                    <div className="sida">Sida</div>
                    <button className="select-page-button" onClick={onNextPage}
                        style={{
                            backgroundColor: ((startIndex + itemsPerPage) < items.products.length) ? "black" : "rgb(230, 230, 230)"
                        }}>
                        <FontAwesomeIcon icon={faArrowRight} className="select-page-icon" />
                    </button>
                </div>
            )}
        </div>
    );
}

function FoodOutput({ displayedInputRows, itemVisibility, onToggleVisibility }:
    {
        displayedInputRows: InputRow[],
        itemVisibility: boolean[],
        onToggleVisibility: (index: number) => void
    }) {
    const [showGuidelines, setShowGuidelines] = useState(false);

    
    function onToggleGuidelines() {
        setShowGuidelines(!showGuidelines);
    }
    return (
        <>
            <div className="food-output">
                <FoodGraph itemVisibility={itemVisibility} showGuidelines={showGuidelines} displayedInputRows={displayedInputRows} />
                <FoodLegend itemVisibility={itemVisibility} onToggleVisibility={onToggleVisibility}
                    onToggleGuidelines={onToggleGuidelines} showGuidelines={showGuidelines} displayedInputRows={displayedInputRows} />
            </div>
        </>
    );
}

function FoodGraph({ itemVisibility, showGuidelines, displayedInputRows }: { itemVisibility: Array<boolean>, showGuidelines: boolean, displayedInputRows: InputRow[] }) {
    const nutrientPropertyKeys: Array<keyof FoodProduct> = ["jod", "jarn", "kalcium", "kalium", "magnesium", "selen", "zink",
        "a", "b1", "b2", "b3", "b6", "b9", "b12", "c", "d", "e"];
    const nutrientLabels: Array<string> = ["Jod", "Järn", "Kalcium", "Kalium", "Magnesium", "Selen", "Zink",
        "A", "B1", "B2", "B3", "B6", "B9", "B12", "C", "D", "E"];

    const allBars = nutrientPropertyKeys.map((property: keyof FoodProduct, index: number) => (
        <FoodGraphCanvasBarContainer key={index} itemVisibility={itemVisibility} nutrientProperty={property} displayedInputRows={displayedInputRows} />
    ));

    const allLabels = nutrientLabels.map((label: string, index: number) => (
        <FoodGraphNutrientsContainer key={index} isMineral={(index < 7) ? true : false} nutrient={label} />
    ));

    return (
        <div className="food-graph">
            <div className="food-graph-canvas-limit-bar">
            </div>
            <div className="food-graph-canvas">
                {allBars}
            </div>
            <div className="food-graph-canvas-limit-bar"></div>
            <div className="food-graph-guideline upperguide" style={{ visibility: `${showGuidelines ? "visible" : "hidden"}` }}></div>
            <div className="food-graph-guideline midguide"></div>
            <div className="food-graph-guideline lowerguide" style={{ visibility: `${showGuidelines ? "visible" : "hidden"}` }}></div>
            <div className="food-graph-twohundred">200%</div>
            <div className="food-graph-hundredfifty" style={{ visibility: `${showGuidelines ? "visible" : "hidden"}` }}>150%</div>
            <div className="food-graph-rdi">100%</div>
            <div className="food-graph-fifty" style={{ visibility: `${showGuidelines ? "visible" : "hidden"}` }}>50%</div>
            <div className="food-graph-nutrients-outer">
                {allLabels}
            </div>
        </div>
    );
}

function FoodGraphNutrientsContainer({ isMineral, nutrient }: { isMineral: boolean; nutrient: string }) {
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

function FoodGraphCanvasBarContainer({ nutrientProperty, displayedInputRows, itemVisibility }:
    {
        nutrientProperty: keyof FoodProduct,
        displayedInputRows: InputRow[],
        itemVisibility: Array<boolean>
    }) {
    const content = displayedInputRows.map((item: InputRow, index: number) => (
        <div key={index} className="food-graph-canvas-bar"
            style={{
                backgroundColor: `${barColors[index]}`,
                height: `${(item.decision![nutrientProperty]) as number * 150}px`, // 150 instead of 300 since full height means 200%
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


function FoodLegend({ itemVisibility, onToggleVisibility, onToggleGuidelines, showGuidelines, displayedInputRows }:
    {
        itemVisibility: Array<boolean>,
        onToggleVisibility: (id: number) => void,
        onToggleGuidelines: () => void,
        showGuidelines: boolean,
        displayedInputRows: InputRow[]
    }) {
    const allLegends = displayedInputRows.map((item: InputRow, index: number) => (
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
                     {item.decision!.name}
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
                <div className="visa-container"
                    style={{
                        display: displayedInputRows.length > 0 ? "flex" : "none"
                    }}>
                    Visa i<br />grafen
                </div>
            </div>
            {allLegends}
        </div>
    );
}

