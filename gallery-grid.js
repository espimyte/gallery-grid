/*
*   (DO NOT REMOVE THIS HEADER)
*
*   Author: espimyte (https://espy.world)
*/

/* User variables */
const stylePath = "/gallery-grid/gallery-grid.css";
const smallScreenWidth = 600; // The width the widget considers to be a small screen (mobile)
const disableShortcuts = false; // Whether or not keyboard shortcuts are enabled

/* Default values */
const Defaults = {
    GRID_TYPE: "fixed", // Accepted values: fixed, justified
    CELL_WIDTH: 300, // Grid cell width (for fixed grids)
    CELL_HEIGHT: 300, // Grid cell height (for fixed grids)

    MAX_ROW_HEIGHT: 500, // Max row height for justified grid
    SMALL_MAX_ROW_HEIGHT: 1000, // Small screen max row height for justified grid

    MAX_PER_PAGE: undefined, // Max images per page, no pagination if undefined
    CAPTIONS: "disabled", // Embed description - Accepted values: always, disabled, smallscreen
}

/*
* Keyboard shortcuts
* For a list of key names, see here: https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
*/
const Keybinds = {
    NAV_LEFT: 'ArrowLeft',
    NAV_RIGHT: 'ArrowRight',
    RANDOM: 'r'
}

/* --- DO NOT edit below this point unless you know what you're doing! --- */

const VALID_GRIDTYPES = ["fixed", "justified"];
const VALID_CAPTIONS = ["always", "disabled", "smallscreen"];

main();

class Lightbox {
    // Elements
    static lightboxEl = document.getElementById("lb");
    static titleEl = document.getElementById("lb_title");
    static descEl = document.getElementById("lb_desc");
    static infoEl = document.getElementById("lb_info");
    static tagsEl = document.getElementById("lb_tags");

    static imgWrapperEl = document.getElementById("lb_imageWrapper");
    static imgEl = document.getElementById("lb_image");
    static loadingEl = document.getElementById("lb_loading");

    // Buttons
    static exitButton = document.getElementById("lb_exitButton");
    static smallExitButton = document.getElementById("lb_smallExitButton");

    // Content
    static title;
    static desc;
    static tags;
    static img;
    static imgHeight;
    static imgWidth;

    // Events
    static lightboxOpenEvent = new Event("lightboxopen");
    static lightboxCloseEvent = new Event("lightboxclose");

    // Variables
    static disabled = false;
    static smallScreenEnabled = true;
    static opened = false;

    /** Fixed initialization. */
    static {
        this.exitButton.onclick = function () {Lightbox.close()};
        this.smallExitButton.onclick = function () {Lightbox.close()};

        addEventListener("resize", function() {
            if (Lightbox.isSmallScreen() && !Lightbox.smallScreenEnabled) {
                Lightbox.close();
            }
        })
    }

    /** Sets lightbox to given data and opens lightbox. */
    static openWith(data, imgScale = 1) {
        this.set(data);
        this.open(imgScale);
    }

    /** Sets lightbox to current data. */
    static set({title, desc, tags, img, render, imgWidth, imgHeight}) {
        if (this.disabled) return;
        if (this.isSmallScreen() && !this.smallScreenEnabled) return;

        this.title = title;
        this.desc = desc;
        this.tags = tags;
        this.img = img;
        this.imgWidth = imgWidth;
        this.imgHeight = imgHeight;

        this.titleEl.innerHTML = title;
        this.descEl.innerHTML = desc;

        this.tagsEl.innerHTML = "";
        if (tags) {
            for (let tag of tags) {
                const tagEl = document.createElement("span");
                tagEl.textContent = tag.toUpperCase();
                this.tagsEl.appendChild(tagEl);
            }
        }

        this.imgEl.src = img;
        if (render) {
            this.imgEl.style.imageRendering = render;
        } else {
            this.imgEl.style.imageRendering = undefined;
        }
    }

    /** Opens the lightbox. */
    static open(imgScale = 1) {
        if (this.disabled) return;
        if (this.isSmallScreen() && !this.smallScreenEnabled) return;

        dispatchEvent(this.lightboxOpenEvent);

        this.titleEl.style.display = this.title ? "block" : "none";
        this.descEl.style.display = this.desc ? "block" : "none";
        this.tagsEl.style.display = this.tags ? "flex" : "none";
        this.infoEl.style.display = this.title || this.desc || this.tags ? "flex" : "none";
        this.lightboxEl.style.display = "block";

        this.lightboxEl.classList.add("lb-open");
        this.opened = true;

        let heightBuffer = this.infoEl.offsetHeight;
        if (this.isSmallScreen()) {
            heightBuffer += 120;
        }

        let imageData = this.imgWidth && this.imgHeight ? {width: this.imgWidth, height: this.imgHeight} : undefined;
        if (imgScale != 1 && imageData) {
            this.imgEl.style.width = `${imageData.width * imgScale}px`;
            this.imgEl.style.height = `${imageData.height * imgScale}px`;
        } else {
            this.imgEl.style.width = "";
            this.imgEl.style.height = "";
        }
        this.imgWrapperEl.style.maxHeight = `calc(100% - ${heightBuffer}px)`;

        if (imageData) {
            this.imgEl.style.aspectRatio = `${imageData.width} / ${imageData.height}`;
        } else {
            this.imgEl.style.aspectRatio = "";
        }

        this.loadingEl.style.opacity = "1";
        this.imgEl.onload = () => {
            this.loadingEl.style.opacity = "0";
        }
    }

    /** Closes the lightbox. */
    static close() {
        dispatchEvent(this.lightboxCloseEvent);
        this.lightboxEl.style.display = "none";
        this.lightboxEl.classList.remove("lb-open");
        this.opened = false;
    }

    /** Retrieves image source. */
    static getImgSource(imgSrc) {
        return imgSrc;
    }
    
    /** Returns whether or not the window is a small screen. */
    static isSmallScreen() {
        return (window.innerWidth <= smallScreenWidth);
    }

    /** Sets an event to run whenever the lightbox is opened. */
    static setOnLightboxOpenEvent(lambda) {
        addEventListener("lightboxopen", () => lambda());
    }

    /** Sets an event to run whenever the lightbox is closed. */
    static setOnLightboxCloseEvent(lambda) {
        addEventListener("lightboxclose", () => lambda());
    }

    /** Disables opening the lightbox and closes the lightbox if it is already opened. */
    static disable() {
        this.close();
        this.disabled = true;
    }

    /** Enables opening the lightbox. */
    static enable() {
        this.disabled = false;
    }

    /** Sets whether or not you can open the lightbox on a small screen. */
    static setSmallScreenEnabled(smallScreenEnabled) {
        this.smallScreenEnabled = smallScreenEnabled;
    }
}

/* Defines data for single image in the gallery. */
class GallerySource {
    constructor({id, img, thumb, title, desc, tags, scale = 1, render, imgWidth, imgHeight, order}) {
        this.img = img;
        this.thumb = thumb;

        this.title = title;
        this.desc = desc;
        this.tags = tags;
        this.scale = scale;
        this.render = render;

        this.imgWidth = imgWidth;
        this.imgHeight = imgHeight;

        this.id = id;
        this.order = order;
    }
}

/* Handles gallery functionality. */
class GalleryHandler {
    SWIPE_SPEED = 100;
    SWIPE_BUMP_SPEED = 200;

    /* Defines functions that generate elements for use in fixed grid cells. */
    static fixedCellElementGen = {
        loading: ({}) => {
            // Loading
            let loading = document.createElement("div");
            loading.className = "g-fixedGridCellLoading g-gridCellLoading";
            return loading;
        },
        effect: ({self}) => {
            // Effect
            let effect = document.createElement("div");
            effect.className = "g-fixedGridCellEffect g-gridCellEffect";
            if (!self.smallLightboxEnabled) effect.classList.add("g-smallScreenHide");
            return effect;
        },
        btn: ({self, index}) => {
            // Button to open lightbox
            let btn = document.createElement("button");
            btn.className = "g-fixedGridButton g-gridButton";
            if (!self.smallLightboxEnabled)  btn.classList.add("g-smallScreenHide");
            btn.onclick = () => {
                self.setLightbox(index);
            };
            return btn;
        },
        img: ({self, source}) => {
            // Image
            let img = document.createElement("img");
            img.src = self.getCellImage(source);
            img.className = "g-fixedGridImage g-gridImage";
            if (source.render) img.style.imageRendering = source.render;
            return img;
        },
        desc: ({self, source}) => {
            // Description (if applicable)
            if (self.captions !== "disabled" && source.desc != undefined) {
                let descEl = document.createElement("span");
                descEl.className = "g-gridCellCaption";
                if (self.captions === "smallscreen") descEl.classList.add("g-smallScreen");
                descEl.innerHTML = source.desc;
                return descEl;
            }
        }
    }

    /* Defines functions that generate elements for use in justified grid cells. */
    static justifiedCellElementGen = {
        effect: ({self}) => {
            // Effect
            let effect = document.createElement("div");
            effect.className = "g-justifiedGridCellEffect g-gridCellEffect rm-pause";
            if (!self.smallLightboxEnabled) effect.classList.add("g-smallScreenHide");
            return effect;
        },
        img: ({self, source}) => {
            // Image
            let img = document.createElement("img");
            img.src = self.getCellImage(source);
            img.className = "g-justifiedGridImage g-gridImage";
            if (source.render) img.style.imageRendering = source.render;
            return img;
        },
        btn: ({self, index}) => {
            // Button to open lightbox
            let btn = document.createElement("button");
            btn.className = "g-justifiedGridButton g-gridButton";
            if (!self.smallLightboxEnabled) btn.classList.add("g-smallScreenHide");
            btn.onclick = function () {
                self.setLightbox(index);
            };
            return btn;
        },
        desc: ({self, source}) => {
            // Description (if applicable)
            if (self.captions !== "disabled" && source.desc != undefined) {
                let descEl = document.createElement("span");
                descEl.className = "g-gridCellCaption";
                if (self.captions === "smallscreen") descEl.classList.add("g-smallScreen");
                descEl.innerHTML = source.desc;
                return descEl;
            }
        }
    }

    constructor(sources, {
        allowRandom = false, 
        smallLightboxEnabled = true,
        captions = Defaults.CAPTIONS,
        extra = {}}) {

        var self = this;

        // Sources
        this.sources = sources;
        sources.sort((a, b) => a.order > b.order);

        // Indexing
        this.curr = -1;

        // Buttons
        this.prevButton = document.getElementById("lb_prev");
        this.nextButton = document.getElementById("lb_next");
        this.randButton = document.getElementById("lb_randomButton");
        this.allowRandom = allowRandom;

        // Grid
        this.gridEl;
        this.maxRowHeight;
        this.smallMaxRowHeight;
        this.refreshGrid = () => {};

        // Variables
        this.focused = false;
        this.smallLightboxEnabled = smallLightboxEnabled; // Whether or not the lightbox is enabled for small screens
        this.captions = captions; // Whether or not description is embed on cells
    
        // Setup
        this.setupButtons();
        this.setupShortcuts();
        this.setupListeners();

        // Set extra variables
        for (const [key, value] of Object.entries(extra)) {
            this[key] = value;
        }
        GalleryHandler.onStart(self, extra);
    }

    /* Runs on initialization. Override this to create custom functionality. */
    static onStart(_handler, {}) {}

    /* Runs on sources being changed. Override this to create custom functionality. */
    static onSourcesChanged(handler, _sources) {
        handler.refreshGrid();
    }

    /** Sets lightbox to current index. */
    setLightbox(i) {
        const source = this.sources[i];

        Lightbox.openWith({
            title: source.title, 
            desc: source.desc, 
            tags: source.tags,
            img: source.img,
            render: source.render,
            imgWidth: source.imgWidth,
            imgHeight: source.imgHeight
        }, source.scale)

        this.focused = true;

        this.curr = i;
        this.prevButton.disabled = this.curr == 0;
        this.nextButton.disabled = this.curr == this.sources.length - 1;

        this.prevButton.classList.remove("lb-pressed");
        this.nextButton.classList.remove("lb-pressed");

        if (Lightbox.isSmallScreen()) {
            this.prevButton.style.display = "none";
            this.nextButton.style.display = "none";
        } else {
            this.prevButton.style.display = "block";
            this.nextButton.style.display = "block";
        }
    }

    /** Sets lightbox by id. */
    setLightboxById(id) {
        this.setLightbox(this.getIndex(id));
    }

    /** Gets index of source by id. */
    getIndex(id) {
        return this.sources.findIndex((vs) => vs.id == id);
    }

    /** Sets lightbox to previous. */
    prevLightbox() {
        if (!this.isFirstLightbox()) {
            this.setLightbox(this.curr - 1);
        }
    }

    /** Sets lightbox to next. */
    nextLightbox() {
        if (!this.isLastLightbox()) {
            this.setLightbox(this.curr + 1);
        }
    }

    /** Returns whether or not we are currently on the first lightbox. */
    isFirstLightbox() {
        return this.curr <= 0;
    }

    /** Returns whether or not we are currently on the last lightbox. */
    isLastLightbox() {
        return this.curr >= this.sources.length - 1
    }

    /** Sets random lightbox. */
    randomLightbox() {
        this.setLightbox(Math.floor(Math.random() * this.sources.length));
    }

    /** Sets up lightbox buttons. */
    setupButtons() {
        var self = this;

        // Prev
        this.prevButton.addEventListener("click", function () {
            if (self.focused) self.prevLightbox();
        });

        // Next
        this.nextButton.addEventListener("click", function () {
            if (self.focused) self.nextLightbox();
        }); 

        // Random
        if (this.randButton) {
            this.randButton.addEventListener("click", function() {
                if (self.focused || self.allowRandom) self.randomLightbox();
            }); 
        }
    }

    /** Setup event listeners. */
    setupListeners() {
        var self = this;

        Lightbox.setOnLightboxOpenEvent(() => {
            animateX(Lightbox.imgEl, 0, 0);
        })
        Lightbox.setOnLightboxCloseEvent(() => {
            self.focused = false;
            self.prevButton.style.display = "none";
            self.nextButton.style.display = "none";
        });
        addEventListener("resize", function() {
            if (Lightbox.isSmallScreen()) {
                self.prevButton.style.display = "none";
                self.nextButton.style.display = "none";
            } else {
                self.prevButton.style.display = "block";
                self.nextButton.style.display = "block";
            }
        })

        // Swipe controls for mobile
        let init = {x: 0, y: 0};
        let delta = {x: 0, y: 0};
        let threshold = 100;

        const animateX = (el, x, time) => {
            const anim = el.animate(
                {
                    transform: `translateX(${x}px)`,
                },
                { duration: time, fill: "forwards", easing: "cubic-bezier(0.25, 0.1, 0.25, 1)" }
            )
            return anim;
        }

        addEventListener("touchstart", function(e) {
            init.x = e.touches[0].pageX;
            init.y = e.touches[0].pageY;
        });
        addEventListener("touchmove", function(e) {
            delta.x = e.touches[0].pageX - init.x;
            delta.y = e.touches[0].pageY - init.y;

            animateX(Lightbox.imgEl, delta.x, 0)
            if (delta.x + Math.abs(delta.y) > threshold && !self.isFirstLightbox()) {
                self.prevButton.style.display = "block";
            } else {
                self.prevButton.style.display = "none";
            }
            if (delta.x + (-Math.abs(delta.y)) < (-threshold) && !self.isLastLightbox()) {
                self.nextButton.style.display = "block";
            } else {
                self.nextButton.style.display = "none";
            }
        });
        addEventListener("touchend", function() {
            if (!Lightbox.opened) return;
            if (!self.focused) return;
            
            if (delta.x + Math.abs(delta.y) > threshold) {
                if (!self.isFirstLightbox()) {
                    let moveOutAnim = animateX(Lightbox.imgEl, this.window.innerWidth, self.SWIPE_SPEED);
                    moveOutAnim.onfinish = () => {
                        self.prevLightbox();
                        animateX(Lightbox.imgEl, -this.window.innerWidth, 0);
                        animateX(Lightbox.imgEl, 0, self.SWIPE_SPEED);
                    }
                } else {
                    animateX(Lightbox.imgEl, 20, self.SWIPE_BUMP_SPEED / 2).onfinish = () => {
                        animateX(Lightbox.imgEl, 0, self.SWIPE_BUMP_SPEED / 2);
                    }
                }
            } else if (delta.x + (-Math.abs(delta.y)) < (-threshold)) {
                if (!self.isLastLightbox()) {
                    let moveOutAnim = animateX(Lightbox.imgEl, -this.window.innerWidth, self.SWIPE_SPEED);
                    moveOutAnim.onfinish = () => {
                        self.nextLightbox();
                        animateX(Lightbox.imgEl, this.window.innerWidth, 0);
                        animateX(Lightbox.imgEl, 0, self.SWIPE_SPEED);
                    }
                } else {
                    animateX(Lightbox.imgEl, -20, self.SWIPE_BUMP_SPEED / 2).onfinish = () => {
                        animateX(Lightbox.imgEl, 0, self.SWIPE_BUMP_SPEED / 2);
                    }
                }
            } else {
                animateX(Lightbox.imgEl, 0, self.SWIPE_BUMP_SPEED / 2);
            }
            init = {x: 0, y: 0};
            delta = {x: 0, y: 0};
        });
    }

    /** Sets up keyboard shortcuts. */
    setupShortcuts() {
        if (disableShortcuts) return;
        var self = this;
        document.addEventListener("keydown", function(e) {
            if (self.curr != -1 && self.focused && Lightbox.opened) {
                if (e.key == Keybinds.NAV_LEFT) {
                    self.prevLightbox();
                    self.nextButton.classList.remove("lb-pressed");
                    self.prevButton.classList.add("lb-pressed");
                }
                else if (e.key == Keybinds.NAV_RIGHT) {
                    self.nextLightbox()
                    self.prevButton.classList.remove("lb-pressed");
                    self.nextButton.classList.add("lb-pressed");
                }
            }

            if (e.key == Keybinds.RANDOM && (self.allowRandom || self.focused)) {
                self.randomLightbox();
            }
        });
    }

    /** Returns the size of the source array. */
    getSourceSize() {
        return this.sources.length;
    }

    /** Returns the image to use for the grid cell. */
    getCellImage(source) {
        if (source.thumb) return source.thumb;
        return source.img;
    }

    /** 
     * Initializes a fixed grid using the view sources. 
     * @param parent element to add grid to
     * @param width target fixed width for cell
     * @param height target fixed height for cell
     * @param maxItems that grid can fit
     */
    initializeFixedGrid(parent, {width, height, maxItems}) {
        var self = this;
        this.gridEl = document.createElement("div");
        parent.appendChild(this.gridEl);

        this.generateFixedGrid(width, height, {maxItems: maxItems});
        this.refreshGrid = () => { 
            self.generateFixedGrid(width, height, {maxItems: maxItems}); 
        }
        
        if (maxItems) {
            addEventListener("resize", function () {
                self.refreshGrid();
            });
        }
    }

    /** 
     * Generates fixed grid. 
     * @param width target fixed width for cell
     * @param height target fixed height for cell
     * @param maxItems max items in grid, used for setting a fixed size
     */
    generateFixedGrid(width, height, {maxItems}) {
        var self = this;
        this.gridEl.innerHTML = '';
        this.gridEl.classList.add("g-grid");
        this.gridEl.classList.add("g-fixedGrid");

        let cellRect;

        for (let i = 0; i < this.sources.length; i++) {
            let source = this.sources[i];

            let cell = document.createElement("div");
            cell.className = "g-fixedGridCell g-gridCell";
            cell.style.width = `${width}px`;
            cell.style.height = `${height}px`;

            const cellElements = {};
            for (const [key, gen] of Object.entries(GalleryHandler.fixedCellElementGen)) {
                const cellElement = gen({self: self, source: source, index: i});
                cellElements[key] = cellElement
                if (cellElement && key !== "btn" && key !== "img") {
                    cell.appendChild(cellElement);
                }
            }

            cell.append(cellElements["btn"], cellElements["img"]);
            cellElements["img"].onload = () => {
                cellElements["loading"].style.display = "none";
            }

            this.gridEl.appendChild(cell);
            if (!cellRect) cellRect = cell.getBoundingClientRect();
        }

        // Constrain to min height
        if (maxItems) {
            const gridWidth = this.gridEl.getBoundingClientRect().width;
            const itemsPerRow = Math.floor(gridWidth / cellRect.width);
            const maxRows = Math.ceil(maxItems / itemsPerRow);
            this.gridEl.style.minHeight = `${cellRect.height*maxRows}px`;
        }
    }

    /** 
     * Initializes with justified grid with variable width and height. \
     * @param parent element to add grid to
     * @param maxRowHeight max height for row
     * @param smallMaxRowHeight max height for row for small screens
     */
    initializeJustifiedGrid(parent, {maxRowHeight, smallMaxRowHeight}) {
        var self = this;
        this.gridEl = document.createElement("div");
        parent.appendChild(this.gridEl);
        this.maxRowHeight = maxRowHeight;
        this.smallMaxRowHeight = smallMaxRowHeight;

        self.refreshGrid = () => {};

        self.generateJustifiedGrid(this.maxRowHeight);

        addEventListener("resize", function () {
            self.refreshGrid();
        });
        self.refreshGrid = () => {
            self.generateJustifiedGrid(this.maxRowHeight);
        }
    }

    /** 
     * Generates with justified grid. 
     * @param maxRowHeight max height for row
     */
    generateJustifiedGrid(maxRowHeight) {
        var self = this;
        var gridWidth = self.gridEl.clientWidth;
        
        if (Lightbox.isSmallScreen()) {
            maxRowHeight = self.smallMaxRowHeight ?? smallScreenWidth;
        }

        /**
         * Adds item (cell) to row.
         * Returns image.
         */
        function addItem(source, index, row) {
            let cell = document.createElement("div");
            cell.className = "g-justifiedGridCell g-gridCell";

            const cellElements = {};
            for (const [key, gen] of Object.entries(GalleryHandler.justifiedCellElementGen)) {
                const cellElement = gen({self: self, source: source, index: index});
                cellElements[key] = cellElement
                if (cellElement) cell.appendChild(cellElement);
            }

            let img = cellElements["img"];
            row.appendChild(cell);

            return img;
        }
  
        /** Adds row to grid */
        function addRow(endRow = false) {
            let itemSizesSum = calculateScale()[0];
            let itemHeight = ((gridWidth) / itemSizesSum);

            row.style.height = `${itemHeight}px`;
            itemWidthScales = [];

            row.style.display = "flex";
            row.className = endRow ? "g-justifiedGridRow g-justifiedGridEndRow" : "g-justifiedGridRow";
            row.style.maxHeight = `${maxRowHeight}px`;
            row.style.maxWidth = `${gridWidth * (maxRowHeight / parseInt(row.style.height))}px`;
            self.gridEl.appendChild(row);
            row = document.createElement("div");

            return itemHeight;
        }
  
        /**
         * Calculates row scale.
         * Lower sums = bigger height
         * More items increases the sum, and lowers the height.
         * Returns the sum and whether or not it is of acceptable height.
         */
        function calculateScale() {
            let itemSizesSum = 0;
            itemWidthScales.forEach((itemSize) => {
                itemSizesSum += itemSize;
            });

            let itemHeight = window.innerWidth / itemSizesSum;
            let acceptable = true;
            if (itemHeight > maxRowHeight) {
                acceptable = false;
            }

            return [itemSizesSum, acceptable];
        }

        // Clears grid
        self.gridEl.style.minHeight = `${self.gridEl.offsetHeight}px`;
        self.gridEl.textContent = "";

        self.gridEl.classList.add("g-grid");
        self.gridEl.classList.add("g-justifiedGrid");
        var row = document.createElement("div");
        var itemWidthScales = [];

        // Iterates through all sources
        let currGridHeight = 0;
        for (let i = 0; i < self.sources.length; i++) {
            if (calculateScale()[1] == true) {
            currGridHeight += addRow();
            }

            let source = self.sources[i];
            let loadedImageData = {width: source.imgWidth, height: source.imgHeight}

            if (loadedImageData.width && loadedImageData.height) {
                addItem(source, i, row);
                itemWidthScales.push(loadedImageData.width * (1 / loadedImageData.height));
            } else {
                console.error(`Missing width and height data for ${source.img}`);
            }
        }
        addRow(true);
        self.gridEl.style.minHeight = `${currGridHeight}px`;
    }

    /** Updates the lightbox sources and refreshes. */
    updateSources(sources = this.sources) {
        this.sources = sources;
        GalleryHandler.onSourcesChanged(this, sources);
    }
}

/* Gallery component */
class GalleryGrid extends HTMLElement {
    static observedAttributes = ["id", "gridtype", "maxperpage", "cellwidth", "cellheight", "maxrowheight", "captions", "small-maxrowheight", "small-lbdisabled"];

    constructor() {
        super();
        this.page = 1;
        this.gridType;
    }

    connectedCallback() {
        var sources = [];
        var promises = [];
        let order = 0;

        // Get grid type (or guess it)
        if (!this.getAttribute("gridtype")) {
            this.gridType = Defaults.GRID_TYPE;
            if (this.getAttribute("cellwidth" || this.getAttribute("cellheight"))) this.gridType = "fixed";
            if (this.getAttribute("maxrowheight")) this.gridType = "justified";
        } else {
            this.gridType = this.validateSelection("gridtype", VALID_GRIDTYPES, Defaults.GRID_TYPE);
        }

        Array.from(this.children).forEach((child) => {
            if (!child.getAttribute("src")) {
                console.error("Image is missing src URL.")
                return;
            }

            if (this.gridType === "fixed") {
                sources.push(this.createSource(child, {order: child.getAttribute("order") ?? order}));
                order++;
            } else {
                if (child.width && child.height) {
                    sources.push(this.createSource(child, {width: child.width, height: child.height, order: child.getAttribute("order") ?? order}));
                    order++;
                } else {
                    const cellImage = new Image();
                    const cellOrder = order;
                    cellImage.src = child.getAttribute("thumb") ?? child.getAttribute("src");
                    const loadPromise = new Promise((resolve) => {
                        cellImage.onload = () => {
                            resolve(true);
                        }
                        cellImage.onerror = () => {
                            if (child.getAttribute("thumb")) {
                                console.error("Thumbnail url is invalid.")
                            } else console.error("Image url is invalid.")
                            resolve(false);
                        }
                    })
                    loadPromise.then((success) => {
                        if (success) {
                            sources.push(this.createSource(child, {width: cellImage.naturalWidth, height: cellImage.naturalHeight, order: child.getAttribute("order") ?? cellOrder}));
                        }
                    });
                    promises.push(loadPromise);
                    order++;
                }
            }
        })

        Promise.all(promises).then(() => {
            this.generateGrid(sources);
        })
    }

    createSource(element, {width, height, order}) {
        let scale = element.getAttribute("scale");
        if (!scale) scale = 1;
        scale = parseFloat(scale);
        if (!scale || scale < 0) {
            console.warn("Invalid scale value for "+element.getAttribute("src"));
            scale = 1;
        }

        const source = {
            id: element.id,
            img: element.getAttribute("src"), 
            thumb: element.getAttribute("thumb"), 
            imgWidth: width,
            imgHeight: height,

            title: element.getAttribute("title"), 
            desc: element.getAttribute("desc"), 
            tags: element.getAttribute("tags")?.split(","), 
            scale: scale ?? 1,
            render: element.getAttribute("render"),

            order: order,
        }
        return source;
    }

    validateNumber(valueName, defaultValue) {
        const numStr = this.getAttribute(valueName);
        if (!numStr) return defaultValue;
        const num = parseInt(numStr);
        if (!num) {
            console.warn("Invalid value for "+valueName);
            return defaultValue;
        }
        if (num < 0) {
            console.warn("Cannot use negative number for "+valueName);
            return defaultValue;
        }
        return num;
    }

    validateSelection(valueName, acceptedValues, defaultValue) {
        const value = this.getAttribute(valueName);
        if (!value) return defaultValue;

        if (!acceptedValues.includes(value)) {
            console.warn(`Accepted ${valueName} values: ${acceptedValues.join(", ")}`);
            return defaultValue;
        }

        return value;
    }

    validateBoolean(valueName) {
        const value = this.getAttribute(valueName)
        return value === null ? false : value !== "false";
    }

    generateGrid(sources) {
        var maxPerPage = this.validateNumber("maxperpage", Defaults.MAX_PER_PAGE);
        var width = this.validateNumber("cellwidth", Defaults.CELL_WIDTH);
        var height = this.validateNumber("cellheight", Defaults.CELL_HEIGHT);
        var maxRowHeight = this.validateNumber("maxrowheight", Defaults.MAX_ROW_HEIGHT);

        // Small screen attributes
        var smallMaxRowHeight = this.validateNumber("small-maxrowheight", this.validateNumber("maxrowheight", Defaults.SMALL_MAX_ROW_HEIGHT));
        var smallLbDisabled = this.validateBoolean("small-lbdisabled");

        // Other variables
        var captions = this.validateSelection("captions", VALID_CAPTIONS, Defaults.CAPTIONS);

        // Initialize grid with settings
        const origSources = [...sources]

        if (maxPerPage) {
            sources = origSources.slice(((this.page - 1) * maxPerPage), (this.page * maxPerPage));
        }

        const galleryHandler = new GalleryHandler(sources, {smallLightboxEnabled: !smallLbDisabled, captions: captions});
        this.innerHTML = "";

        if (this.gridType == "fixed") {
            galleryHandler.initializeFixedGrid(this, {
                width: width, 
                height: height
            })
        } else if (this.gridType == "justified") {
            galleryHandler.initializeJustifiedGrid(this, {smallMaxRowHeight: smallMaxRowHeight, maxRowHeight: maxRowHeight})
        }

        // Create page nav (if applicable)
        if (!maxPerPage) return;
        const pageCount = Math.max(Math.floor(origSources.length / maxPerPage) + ((origSources.length % maxPerPage) !== 0 ? 1 : 0), 1)
        const pageNav = document.createElement("div");
        pageNav.className = "g-pageNav";

        const prevButton = document.createElement("button");
        prevButton.className = "g-pageNavPrev g-pageNavButton";
        if (this.page === 1) prevButton.disabled = true;
        pageNav.appendChild(prevButton);
        prevButton.onclick = () => {
            this.page = Math.max(1, this.page - 1);
            this.generateGrid(origSources);
        }

        const pageNum = document.createElement("span");
        pageNum.textContent = this.page;
        pageNav.appendChild(pageNum);

        const nextButton = document.createElement("button");
        nextButton.className = "g-pageNavNext g-pageNavButton";
        if (this.page === pageCount) nextButton.disabled = true;
        pageNav.appendChild(nextButton);
        nextButton.onclick = () => {
            this.page = Math.min(pageCount, this.page + 1);
            this.generateGrid(origSources);
        }

        this.appendChild(pageNav);
    }
}
customElements.define('gallery-grid', GalleryGrid);

function main() {
    // Apply CSS
    if (!document.querySelector(`link[href='${stylePath}'`)) {
        const cssLink = document.createElement('link');
        cssLink.type = 'text/css';
        cssLink.rel = 'stylesheet';
        cssLink.href = stylePath;
        document.getElementsByTagName('head')[0].appendChild(cssLink);
    }

    // Add lightbox element
    const lbCore = document.createElement("div");
    lbCore.id = "lb";
    lbCore.innerHTML = `
        <div id="lb_wrapper">     
            <button class="lb-nav" id="lb_prev"></button>
            <div id="lb_container">
                <button id="lb_exitButton"></button>
                <button id="lb_smallExitButton"><p id="lb_exitText">X</p></button>
                <div id="lb_imageWrapper">
                    <img id="lb_image" />  
                    <div id="lb_loading"></div>
                </div>     
                <div id="lb_info">
                    <div id="lb_tags"></div>
                    <p id="lb_title"></p>
                    <p id="lb_desc"></p>
                </div>
            </div>
            <button class="lb-nav" id="lb_next"></button>
        </div>`
    document.getElementsByTagName('body')[0].appendChild(lbCore);
}