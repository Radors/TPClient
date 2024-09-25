import { Fragment, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import './App.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfo, faPlay, faPlus, faSquarePollVertical, faXmark, faArrowRight, faArrowLeft, faCircleXmark, faMinimize, } from '@fortawesome/free-solid-svg-icons';
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
    const startingPoint = [{ id: 0, query: "", active: false },
                           { id: 1, query: "", active: false },
                           { id: 2, query: "", active: false }]
    const [inputRows, setInputRows] = useState(startingPoint);
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

    const fetchData = useCallback(async (activeItem: { id: number, query: string, active: boolean }, searchType: SearchType) => {
        const urlBase = "https://tp-api.salmonwave-4f8bbb94.swedencentral.azurecontainerapps.io/food/search/";
        const urlChoice = (searchType == SearchType.Basic) ? "basic" : "embeddings";
        try {
            const response = await fetch(`${urlBase}${urlChoice}?query=${activeItem.query}&frontendid=${activeItem.id}`);

            if (response.ok) {
                const items: FoodProduct[] = await response.json();
                if (searchType == SearchType.Basic) {
                    setFoodProducts({ products: items, id: activeItem.id });
                }
                else if (searchType == SearchType.Embeddings) {
                    const firstEightBasicsNames = foodProductsRef.current.products.slice(0, 8).map(product => product.name.toLowerCase());

                    const newItems = items.filter(item => {
                        return !firstEightBasicsNames.includes(item.name.toLowerCase());
                    });

                    setFoodProductsFromEmbeddings({ products: newItems, id: activeItem.id });
                }
            } else if (response.status === 503) {
                console.log("test");
            }
        } catch (error) {
            console.error(error);
        }
    }, []);

    useEffect(() => {
        if (typeof activeInput.query === "string" && activeInput.query.trim() !== "") {
            const query = activeInput.query;
            const handler = setTimeout(() => {
                setDebouncedQuery(query);
            }, 275);

            return () => {
                clearTimeout(handler);
            };
        }
    }, [activeInput.query, activeInput.id]);

    useEffect(() => {
        if (debouncedQuery !== "") {
            const activeItem = inputRows.find(e => e.active);
            if (activeItem && activeItem.query === debouncedQuery) {
                setDebouncedQuery("");
                fetchData(activeItem, SearchType.Basic);
                fetchData(activeItem, SearchType.Embeddings);
            }
        }
    }, [debouncedQuery, fetchData, inputRows]);

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

    function onInputToMatvara(event: React.ChangeEvent<HTMLInputElement>, index: number) {
        const newInputRows = inputRows.map(item =>
            item.id === inputRows[index].id
                ? { ...item, active: true }
                : { ...item, active: false }
        );
        newInputRows[index].query = event.target.value;
        setInputRows(newInputRows);
    }

    function onToggleMerInformation() {
        setMerInformation(!merInformation);
    }

    function onAddInputRow() {
        const newInputRows = inputRows.slice();
        newInputRows.push({ id: (newInputRows[newInputRows.length - 1].id + 1), query: "", active: false});
        setInputRows(newInputRows);
    }

    function onRemoveInputRow(index: number) {
        const newInputRows = inputRows.slice();
        newInputRows.splice(index, 1);
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
            />
        </div>
    );
}

function TopBar({ onToggleMerInformation }: { onToggleMerInformation: () => void}) {
    return (
        <div className="top-bar">
            <div className="top-bar-inner">
                <button className="demonstration">
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

function FoodMain({ inputRows, onAddInputRow, onRemoveInputRow, onInputToMatvara,
    merInformation, onToggleMerInformation, onSetActive, foodProducts, foodProductsFromEmbeddings, onHideActive }:
    {
        inputRows: Array<{ id: number, query: string, active: boolean}>,
        onAddInputRow: () => void,
        onRemoveInputRow: (index: number) => void,
        onInputToMatvara: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void,
        merInformation: boolean,
        onToggleMerInformation: () => void,
        onSetActive: (id: number) => void,
        foodProducts: { products: Array<FoodProduct>; id: number },
        foodProductsFromEmbeddings: { products: Array<FoodProduct>; id: number },
        onHideActive: () => void
    }) {
    return (
        <div className="food-main">
            <div className="food-main-left">
                <FoodInputOuter
                    onAddInputRow={onAddInputRow} onRemoveInputRow={onRemoveInputRow} inputRows={inputRows} merInformation={merInformation}
                    onInputToMatvara={onInputToMatvara} onToggleMerInformation={onToggleMerInformation}
                    onSetActive={onSetActive} foodProducts={foodProducts} foodProductsFromEmbeddings={foodProductsFromEmbeddings}
                    onHideActive={onHideActive}
                />
            </div>
            <div className="food-main-divider">
            </div>
            <div className="food-main-right">
                <FoodOutput />
            </div>
        </div>
    );
}

function FoodInputOuter({ inputRows, onAddInputRow, onRemoveInputRow, onInputToMatvara,
    merInformation, onToggleMerInformation, onSetActive, foodProducts, foodProductsFromEmbeddings, onHideActive }:
    {
        inputRows: Array<{ id: number, query: string, active: boolean}>,
        onAddInputRow: () => void,
        onRemoveInputRow: (index: number) => void,
        onInputToMatvara: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void,
        merInformation: boolean,
        onToggleMerInformation: () => void,
        onSetActive: (id: number) => void,
        foodProducts: { products: Array<FoodProduct>; id: number },
        foodProductsFromEmbeddings: { products: Array<FoodProduct>; id: number },
        onHideActive: () => void
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
                    onHideActive={onHideActive} />

                <div className="lagg-till-fler-outer">
                    <button className="lagg-till-fler" onClick={onAddInputRow}>
                        <FontAwesomeIcon size="lg" className="plus-icon" icon={faPlus} />
                        Lägg till fler
                    </button>
                </div>
                <button className="generera-resultat" >
                    <FontAwesomeIcon className="resultat-icon" size="xl" icon={faSquarePollVertical} />
                    Visa näringsvärden
                </button>
            </div>
        </div>
    );
}

function FoodInputs({ onRemoveInputRow, inputRows, onInputToMatvara, onSetActive, foodProducts, foodProductsFromEmbeddings, onHideActive }:
    {
        onRemoveInputRow: (index: number) => void,
        inputRows: Array<{ id: number, query: string, active: boolean}>,
        onInputToMatvara: (event: React.ChangeEvent<HTMLInputElement>, index: number) => void,
        onSetActive: (id: number) => void,
        foodProducts: { products: Array<FoodProduct>; id: number },
        foodProductsFromEmbeddings: { products: Array<FoodProduct>; id: number },
        onHideActive: () => void
    }) {
    const content = inputRows.map((row: { id: number, query: string, active: boolean}, index: number) => (
        <Fragment key={row.id}> 
            <div className="food-item-column"
                style={{
                    border: row.active ? "1px solid lightgray" : "none",
                }}>
                <div className="food-item-upper-permanent">
                    <input className="matvara" type="text" value={row.query} onChange={(event) => onInputToMatvara(event, index)} onClick={() => onSetActive(row.id)} placeholder="Matvara" />
                    <button className="ta-bort" onClick={() => onRemoveInputRow(index)}
                        style={{
                            visibility: inputRows.length == 1 ? "hidden" : "visible",
                        }}>
                        <FontAwesomeIcon size="xl" icon={faCircleXmark} />
                    </button>
                </div>
                <div className="food-input-activated"
                    style={{
                        display: row.active ? 'flex' : 'none',
                    }}>
                    <div className="search-results-splitter">
                        <SearchResults title="Sökresultat" items={foodProducts} activeId={row.id}  />
                        <SearchResults title="Liknande resultat" items={foodProductsFromEmbeddings} activeId={row.id} />
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

function SearchResults({ title, items, activeId }: { title: string, items: { products: Array<FoodProduct>; id: number }, activeId: number }) {
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
            <div key={index} className="search-item">
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


    const EmptyArrayToAvoidErrorForNow: Array<FoodProduct> = []; /* |||||||||||||||||||||| */
    return (
        <>
            <div className="food-output">
                <FoodGraph itemVisibility={itemVisibility} showGuidelines={showGuidelines} foodProducts={EmptyArrayToAvoidErrorForNow} />
                <FoodLegend itemVisibility={itemVisibility} onToggleVisibility={onToggleVisibility}
                    onToggleGuidelines={onToggleGuidelines} showGuidelines={showGuidelines} foodProducts={EmptyArrayToAvoidErrorForNow} />
            </div>
        </>
    );
}

function FoodGraph({ itemVisibility, showGuidelines, foodProducts }: { itemVisibility: Array<boolean>, showGuidelines: boolean, foodProducts: Array<FoodProduct> }) {
    const nutrientPropertyKeys: Array<keyof FoodProduct> = ["jod", "jarn", "kalcium", "kalium", "magnesium", "selen", "zink",
        "a", "b1", "b2", "b3", "b6", "b9", "b12", "c", "d", "e"];
    const nutrientLabels: Array<string> = ["Jod", "Järn", "Kalcium", "Kalium", "Magnesium", "Selen", "Zink",
        "A", "B1", "B2", "B3", "B6", "B9", "B12", "C", "D", "E"];

    const allBars = nutrientPropertyKeys.map((property: keyof FoodProduct, index: number) => (
        <FoodGraphCanvasBarContainer key={index} itemVisibility={itemVisibility} nutrientProperty={property} foodProducts={foodProducts} />
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
            <div className="food-graph-rdi">RDI</div>
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

function FoodGraphCanvasBarContainer({ nutrientProperty, foodProducts, itemVisibility }:
    {
        nutrientProperty: keyof FoodProduct,
        foodProducts: Array<FoodProduct>,
        itemVisibility: Array<boolean>
    }) {
    const content = foodProducts.map((item: FoodProduct, index: number) => (
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


function FoodLegend({ itemVisibility, onToggleVisibility, onToggleGuidelines, showGuidelines, foodProducts }:
    {
        itemVisibility: Array<boolean>,
        onToggleVisibility: (id: number) => void,
        onToggleGuidelines: () => void,
        showGuidelines: boolean,
        foodProducts: Array<FoodProduct>
    }) {
    const allLegends = foodProducts.map((item: FoodProduct, index: number) => (
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
                <div className="visa-container">
                    Visa i<br />grafen
                </div>
            </div>
            {allLegends}
        </div>
    );
}

