﻿import './App.css';
import { Fragment, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfo, faPlus, faSquarePollVertical, faXmark, faArrowRight, faArrowLeft, faCircleXmark, faMinimize, faCircleCheck, faArrowRotateLeft, } from '@fortawesome/free-solid-svg-icons';
import { useMediaQuery } from 'react-responsive';

interface FoodProduct {
    query: string;
    frontendId: number;
    name: string;
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
type VisualMax = 50 | 100 | 200 | 400;

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
    const [moreInformation, setMoreInformation] = useState(false);
    const [foodProducts, setFoodProducts] = useState<{ products: FoodProduct[]; id: number }>({ products: [], id: -1 });
    const [foodProductsFromEmbeddings, setFoodProductsFromEmbeddings] = useState<{ products: FoodProduct[]; id: number }>({ products: [], id: -1 });
    const [debouncedQuery, setDebouncedQuery] = useState("");
    const [failedRequest, setFailedRequest] = useState({ basic: false, embeddings: false });
    const [lightlyWarmed, setLightlyWarmed] = useState(false);
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
        async function fetchWithTimeout(url: string, options = {}, timeout = 1500): Promise<Response> {
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
        function handleRequestFailure(searchType: SearchType) {
            if (searchType === SearchType.Basic) {
                setFailedRequest((previous) => ({ ...previous, basic: true }));
                setFoodProducts({ products: [], id: -1 });
            } else {
                setFailedRequest((previous) => ({ ...previous, embeddings: true }));
                setFoodProductsFromEmbeddings({ products: [], id: -1 });
            }
        }
        function clearRequestFailure(searchType: SearchType) {
            if (searchType === SearchType.Basic) {
                setFailedRequest((previous) => ({ ...previous, basic: false }));
            } else {
                setFailedRequest((previous) => ({ ...previous, embeddings: false }));
            }
        }
        clearRequestFailure(searchType);
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
                        handleRequestFailure(searchType);
                        break;
                    case 503:
                        console.error("The request returned: 503 Service Unavailable");
                        handleRequestFailure(searchType);
                        break;
                    default:
                        console.error(`The request resulted in an unexpected status code: ${response.status}`);
                        handleRequestFailure(searchType);
                        break;
                }
            }
        } catch (error: unknown) {
            if (error instanceof TimeoutError) {
                console.error("TimeoutError");
                handleRequestFailure(searchType);
            } else {
                console.error("Unexpected error:", error);
                handleRequestFailure(searchType);
            }
        }
    }, []);

    useEffect(() => {
        const warm = async () => {
            const basicWarming = "https://tp-api.salmonwave-4f8bbb94.swedencentral.azurecontainerapps.io/food/search/basic?query=tomat&frontendid=900";
            await fetch(basicWarming);
        }
        if (!lightlyWarmed) {
            setLightlyWarmed(true);
            warm();
        }
    }, [lightlyWarmed]);

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

    function resetBothFailureStates() {
        setFailedRequest({ basic: false, embeddings: false });
    }
    function onClearTopState() {
        setInputRows(startingPoint);
        setDisplayedInputRows([]);
        setItemVisibility([]);
        setMoreInformation(false);
        setDebouncedQuery("");
        setFoodProducts({ products: [], id: -1 });
        setFoodProductsFromEmbeddings({ products: [], id: -1 });
    }
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
        resetBothFailureStates();
        setInputRows(newInputRows);
    }
    function onHideActive() {
        const newInputRows = inputRows.map(item =>
            ({ ...item, active: false })
        );
        resetBothFailureStates();
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
    function onToggleMoreInformation() {
        setMoreInformation(!moreInformation);
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
            <TopBar onToggleMoreInformation={onToggleMoreInformation} onClearTopState={onClearTopState} />
            <FoodMain inputRows={inputRows}
                onAddInputRow={onAddInputRow}
                onRemoveInputRow={onRemoveInputRow}
                moreInformation={moreInformation}
                onInputToMatvara={onInputToMatvara}
                onToggleMoreInformation={onToggleMoreInformation}
                onSetActive={onSetActive}
                foodProducts={foodProducts}
                foodProductsFromEmbeddings={foodProductsFromEmbeddings}
                onHideActive={onHideActive}
                onSelectFoodProduct={onSelectFoodProduct}
                onDisplayNutrition={onDisplayNutrition}
                displayedInputRows={displayedInputRows}
                itemVisibility={itemVisibility}
                onToggleVisibility={onToggleVisibility}
                failedRequest={failedRequest}
            />
        </div>
    );
}

function TopBar({ onToggleMoreInformation, onClearTopState }: { onToggleMoreInformation: () => void, onClearTopState: () => void }) {
    return (
        <div className="top-bar">
            <div className="top-bar-inner">
                <button className="more-information" onClick={onToggleMoreInformation}>
                    <FontAwesomeIcon icon={faInfo} size="sm" className="info-icon"/>
                    Mer information
                </button>
                <button className="restore-button" onClick={onClearTopState}>
                    <FontAwesomeIcon icon={faArrowRotateLeft} size="sm" className="restore-icon"/>
                    Återställ alla fält
                </button>
            </div>
        </div>
    );
}

function FoodMain({ inputRows, onAddInputRow, onRemoveInputRow, onInputToMatvara,
    moreInformation, onToggleMoreInformation, onSetActive, foodProducts, foodProductsFromEmbeddings,
    onHideActive, onSelectFoodProduct, onDisplayNutrition, displayedInputRows, itemVisibility, onToggleVisibility, failedRequest }:
    {
        inputRows: Array<{ id: number, query: string, active: boolean, hasDecided: boolean, decision: FoodProduct | null }>,
        onAddInputRow: () => void,
        onRemoveInputRow: (index: number) => void,
        onInputToMatvara: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void,
        moreInformation: boolean,
        onToggleMoreInformation: () => void,
        onSetActive: (id: number) => void,
        foodProducts: { products: Array<FoodProduct>; id: number },
        foodProductsFromEmbeddings: { products: Array<FoodProduct>; id: number },
        onHideActive: () => void,
        onSelectFoodProduct: (product: FoodProduct) => void,
        onDisplayNutrition: () => void,
        displayedInputRows: InputRow[],
        itemVisibility: boolean[],
        onToggleVisibility: (index: number) => void,
        failedRequest: { basic: boolean, embeddings: boolean }
    }) {
    return (
        <div className="food-main">
            <div className="food-main-left">
                <FoodInputOuter
                    onAddInputRow={onAddInputRow} onRemoveInputRow={onRemoveInputRow} inputRows={inputRows} moreInformation={moreInformation}
                    onInputToMatvara={onInputToMatvara} onToggleMoreInformation={onToggleMoreInformation} onSetActive={onSetActive}
                    foodProducts={foodProducts} foodProductsFromEmbeddings={foodProductsFromEmbeddings} onHideActive={onHideActive}
                    onSelectFoodProduct={onSelectFoodProduct} onDisplayNutrition={onDisplayNutrition} failedRequest={failedRequest}
                />
            </div>
            <div className="food-main-divider">
            </div>
            <div className="food-main-right" id="display">
                <FoodOutput displayedInputRows={displayedInputRows} itemVisibility={itemVisibility} onToggleVisibility={onToggleVisibility} />
            </div>
        </div>
    );
}

function FoodInputOuter({ inputRows, onAddInputRow, onRemoveInputRow, onInputToMatvara,
    moreInformation, onToggleMoreInformation, onSetActive, foodProducts, foodProductsFromEmbeddings, 
    onHideActive, onSelectFoodProduct, onDisplayNutrition, failedRequest }:
    {
        inputRows: Array<{ id: number, query: string, active: boolean, hasDecided: boolean, decision: FoodProduct | null }>,
        onAddInputRow: () => void,
        onRemoveInputRow: (index: number) => void,
        onInputToMatvara: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void,
        moreInformation: boolean,
        onToggleMoreInformation: () => void,
        onSetActive: (id: number) => void,
        foodProducts: { products: Array<FoodProduct>; id: number },
        foodProductsFromEmbeddings: { products: Array<FoodProduct>; id: number },
        onHideActive: () => void,
        onSelectFoodProduct: (product: FoodProduct) => void,
        onDisplayNutrition: () => void,
        failedRequest: { basic: boolean, embeddings: boolean }
    }) {
    const onlyOneColumn = useMediaQuery({ maxWidth: 988 });
    return (
        <div className="food-input">
            <div className="more-information-outer"
            style={{
                display: moreInformation ? "flex" : "none",
            }}>
                <div className="more-information-container">
                    <div className="more-information-inner">
                        <div className="more-information-text-one">
                            Näringsvärden indikerar innehåll per 100 gram.<br />
                            Dessa värden visas som procent av rekommenderat intag.<br />
                        </div>
                        <div className="more-information-text-two">
                            Datamängden med näringstäthet är hämtad från:<br />
                            <i>Livsmedelsverkets livsmedelsdatabas, 2024-05-29.</i><br />
                        </div>
                        <div className="more-information-text-three">
                            Rekommendationer gällande dagligt intag baseras på:<br />
                            <i>Nordiska Näringsrekommendationer, NNR 2023.</i><br />
                        </div>
                    </div>
                    <button className="click-to-hide hide-information" onClick={onToggleMoreInformation}>
                        <FontAwesomeIcon icon={faXmark} size="lg" />
                    </button>
                </div>
            </div>
            <div className="food-inputs-column-outer">
                <FoodInputs onInputToMatvara={onInputToMatvara} inputRows={inputRows} onRemoveInputRow={onRemoveInputRow}
                    onSetActive={onSetActive} foodProducts={foodProducts} foodProductsFromEmbeddings={foodProductsFromEmbeddings}
                    onHideActive={onHideActive} onSelectFoodProduct={onSelectFoodProduct} failedRequest={failedRequest} />

                <div className="add-inputrow-outer">
                    <button className="add-inputrow" onClick={onAddInputRow}>
                        <FontAwesomeIcon size="lg" className="plus-icon" icon={faPlus} />
                        <div className="add-inputrow-text">
                            Lägg till fler
                        </div>
                    </button>
                </div>
                <a className="display-output-button" onClick={onDisplayNutrition} href={onlyOneColumn ? "#display" : undefined} >
                    <FontAwesomeIcon className="resultat-icon" size="xl" icon={faSquarePollVertical} />
                    <div className="display-output-button-text">
                        Visa näringsvärden
                    </div>
                </a>
            </div>
        </div>
    );
}

function FoodInputs({ onRemoveInputRow, inputRows, onInputToMatvara, onSetActive, foodProducts, foodProductsFromEmbeddings, onHideActive, onSelectFoodProduct, failedRequest }:
    {
        onRemoveInputRow: (index: number) => void,
        inputRows: Array<{ id: number, query: string, active: boolean, hasDecided: boolean, decision: FoodProduct | null }>,
        onInputToMatvara: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void,
        onSetActive: (id: number) => void,
        foodProducts: { products: Array<FoodProduct>; id: number },
        foodProductsFromEmbeddings: { products: Array<FoodProduct>; id: number },
        onHideActive: () => void,
        onSelectFoodProduct: (product: FoodProduct) => void,
        failedRequest: { basic: boolean, embeddings: boolean }
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
                                    `${row.decision.name.slice(0, 38)}${row.decision.name.length > 38 ? "..." : ""}`
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
                        <SearchResults title="Sökresultat" items={foodProducts} activeId={row.id} onSelectFoodProduct={onSelectFoodProduct} hasFailed={failedRequest.basic} />
                        <SearchResults title="Liknande resultat" items={foodProductsFromEmbeddings} activeId={row.id} onSelectFoodProduct={onSelectFoodProduct} hasFailed={failedRequest.embeddings} />
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

function SearchResults({ title, items, activeId, onSelectFoodProduct, hasFailed }:
    {
        title: string,
        items: { products: Array<FoodProduct>; id: number },
        activeId: number,
        onSelectFoodProduct: (product: FoodProduct) => void,
        hasFailed: boolean
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

    useEffect(() => {
        setStartIndex(0);
    }, [items]);

    const visibleItems = items.products.slice(startIndex, (startIndex + itemsPerPage));

    const results = visibleItems.map((item: FoodProduct, index: number) => {
        if (isLoading) {
            return;
        }
        return (
            <div key={index} className="search-item" onClick={() => onSelectFoodProduct(item)}>
                <p className="search-item-paragraph">
                    {item.name.slice(0, 60)}
                </p>
            </div>
        );
    });
    return (
        <div className="search-results"> 
            <div className="search-results-title">{title}</div>
            <div className="search-items-container">
                {results}
                {hasFailed && (
                    <div className="failure-message">
                        <i>Servern verkar vara under tung belastning, eller så har något hänt som måste åtgärdas av en mänsklig hand.</i>
                    </div>
                )}
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
    const [visualMax, setVisualMax] = useState<VisualMax>(100);

    function onSelectVisualMax(choice: VisualMax) {
        if (choice !== visualMax) {
            setVisualMax(choice);
        }
    }
    return (
        <>
            <div className="food-output">
                <FoodGraph itemVisibility={itemVisibility} displayedInputRows={displayedInputRows} visualMax={visualMax} />
                <FoodLegend itemVisibility={itemVisibility} onToggleVisibility={onToggleVisibility} displayedInputRows={displayedInputRows}
                            onSelectVisualMax={onSelectVisualMax} visualMax={visualMax} />
            </div>
        </>
    );
}

function FoodGraph({ itemVisibility, displayedInputRows, visualMax }: { itemVisibility: Array<boolean>, displayedInputRows: InputRow[], visualMax: VisualMax }) {
    const nutrientPropertyKeys: Array<keyof FoodProduct> = ["jod", "jarn", "kalcium", "kalium", "magnesium", "selen", "zink",
        "a", "b1", "b2", "b3", "b6", "b9", "b12", "c", "d", "e"];
    const nutrientLabels: Array<string> = ["Jod", "Järn", "Kalcium", "Kalium", "Magnesium", "Selen", "Zink",
        "A", "B1", "B2", "B3", "B6", "B9", "B12", "C", "D", "E"];

    const allBars = nutrientPropertyKeys.map((property: keyof FoodProduct, index: number) => (
        <FoodGraphCanvasBarContainer key={index} itemVisibility={itemVisibility} nutrientProperty={property} displayedInputRows={displayedInputRows} visualMax={visualMax} />
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
            <div className="food-graph-guideline upperguide"></div>
            <div className="food-graph-guideline midguide"></div>
            <div className="food-graph-guideline lowerguide"></div>
            <div className="guideline-label guide-label-one">
                {visualMax === 50 ? "50%" : (visualMax === 100 ? "100%" : (visualMax === 200 ? "200%" : "400%"))}
            </div>
            <div className="guideline-label guide-label-two">
                {visualMax === 50 ? "25%" : (visualMax === 100 ? "50%" : (visualMax === 200 ? "100%" : "200%"))}
            </div>
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

function FoodGraphCanvasBarContainer({ nutrientProperty, displayedInputRows, itemVisibility, visualMax }:
    {
        nutrientProperty: keyof FoodProduct,
        displayedInputRows: InputRow[],
        itemVisibility: Array<boolean>,
        visualMax: VisualMax
    }) {
    const content = displayedInputRows.map((item: InputRow, index: number) => (
        <div key={index} className="food-graph-canvas-bar"
            style={{
                backgroundColor: `${barColors[index]}`,
                height: `${(item.decision![nutrientProperty]) as number * 300 * 100 / visualMax}px`,
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

function FoodLegend({ itemVisibility, onToggleVisibility, displayedInputRows, onSelectVisualMax, visualMax }:
    {
        itemVisibility: Array<boolean>,
        onToggleVisibility: (id: number) => void,
        displayedInputRows: InputRow[],
        onSelectVisualMax: (choice: VisualMax) => void,
        visualMax: VisualMax
    }) {
    const allLegends = displayedInputRows.map((item: InputRow, index: number) => (
        <div key={index} className="food-legend-and-switch">
            <div className="food-legend-container">
                <div className="food-legend-colormark-outer">
                    <div className="food-legend-colormark"
                        style={{
                            backgroundColor: `${barColors[index]}`
                        }}>
                    </div>
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
                <div className="select-scale-container">
                    <div className="select-scale-column">
                        <div className="select-scale-label">
                            Maximalt värde för visualisering
                        </div>
                        <div className="select-scale-buttons">
                            <button className="select-scale-button" onClick={() => onSelectVisualMax(50)}
                                style={{
                                    backgroundColor: visualMax === 50 ? "black" : "white",
                                    color: visualMax === 50 ? "white" : "black"
                                }}>
                                50%
                            </button>
                            <button className="select-scale-button" onClick={() => onSelectVisualMax(100)}
                                style={{
                                    backgroundColor: visualMax === 100 ? "black" : "white",
                                    color: visualMax === 100 ? "white" : "black"
                                }}>
                                100%
                            </button>
                            <button className="select-scale-button" onClick={() => onSelectVisualMax(200)}
                                style={{
                                    backgroundColor: visualMax === 200 ? "black" : "white",
                                    color: visualMax === 200 ? "white" : "black"
                                }}>
                                200%
                            </button>
                            <button className="select-scale-button" onClick={() => onSelectVisualMax(400)}
                                style={{
                                    backgroundColor: visualMax === 400 ? "black" : "white",
                                    color: visualMax === 400 ? "white" : "black"
                                }}>
                                400%
                            </button>
                        </div>
                    </div>
                </div>
                <div className="visa-container"
                    style={{
                        display: displayedInputRows.length > 0 ? "flex" : "none"
                    }}>
                    Visa
                </div>
            </div>
            {allLegends}
        </div>
    );
}