/*
*   (DO NOT REMOVE THIS HEADER)
*
*   Author: espimyte (https://espy.world)
*/

/* User variables */
var stylePath = "/style/gallery-grid.css";
var smallScreenWidth = 600; // The width the widget considers to be a small screen (mobile)
var disableShortcuts = false; // Whether or not keyboard shortcuts are enabled

/* Default values */
const Defaults = {
    GRID_TYPE: "fixed", // Accepted values: fixed, justified
    CELL_WIDTH: 250, // Grid cell width (for fixed grids)
    CELL_HEIGHT: 250, // Grid cell height (for fixed grids)

    MAX_ROW_HEIGHT: 500, // Max row height for justified grid
    SMALL_MAX_ROW_HEIGHT: 1000, // Small screen max row height for justified grid

    MAX_PER_PAGE: undefined, // Max images per page, no pagination if undefined
    CAPTIONS: "disabled", // Embed description - Accepted values: always, disabled, smallscreen

    FILTERS: "none", // Filter type for the grid - Accepted values: tags, none
    SORT: "none", // Sort type for the gallery - Accepted values: default, none
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
const VALID_FILTERS = ["tags", "none"];
const VALID_SORTS = ["default", "alphabetical", "none"]

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
    static imgScale = 1;

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
    static openWith(data) {
        this.set(data);
        this.open();
    }

    /** Sets lightbox to current data. */
    static set({title, desc, tags, img, render, noframe, imgWidth, imgHeight, imgScale = 1}) {
        if (this.disabled) return;
        if (this.isSmallScreen() && !this.smallScreenEnabled) return;

        this.title = title;
        this.desc = desc;
        this.tags = tags;
        this.img = img;
        this.imgWidth = imgWidth;
        this.imgHeight = imgHeight;
        this.imgScale = imgScale;

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
        this.imgEl.style.imageRendering = render ? render : undefined;
        if (noframe) this.imgEl.classList.add("lb-noframe");
        else this.imgEl.classList.remove("lb-noframe");
    }

    /** Opens the lightbox. */
    static open() {
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

        this.imgWrapperEl.style.maxHeight = `calc(100% - ${heightBuffer}px)`;

        this.loadingEl.style.opacity = "1";
        this.imgEl.onload = () => {
            this.loadingEl.style.opacity = "0";
            if (this.imgScale != 1) {
                this.imgEl.style.width = `${this.imgEl.naturalWidth * this.imgScale}px`;
                this.imgEl.style.height = `${this.imgEl.naturalHeight * this.imgScale}px`;
            } else {
                this.imgEl.style.width = ``;
                this.imgEl.style.height = ``;
            }
            this.imgEl.style.aspectRatio = `${this.imgEl.naturalWidth} / ${this.imgEl.naturalHeight}`;
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
    constructor({id, img, thumb, imgWidth, imgHeight, title, desc, tags, render, thumbRender, scale, noframe, order, element}) {
        this.id = id;
        this.img = img;
        this.thumb = thumb;

        this.imgWidth = imgWidth;
        this.imgHeight = imgHeight;

        this.title = title;
        this.desc = desc;
        this.tags = tags;
        this.scale = scale ?? 1;

        this.render = render;
        this.thumbRender = thumbRender;
        this.noframe = noframe;
        this.order = order;

        this.element = element;
    }

    static fromElement(element, {width, height, order}) {
        let scale = element.getAttribute("scale");
        if (!scale) scale = 1;
        scale = parseFloat(scale);
        if (!scale || scale < 0) {
            console.warn("Invalid scale value for "+element.getAttribute("src"));
            scale = 1;
        }

        let noframe = element.getAttribute("noframe");
        noframe = noframe === null ? false : noframe !== "false";

        return new GallerySource({element, id: element.id, img: element.getAttribute("src"), thumb: element.getAttribute("thumb"), imgWidth: width, imgHeight: height, title: element.getAttribute("title"), desc: element.getAttribute("desc"), tags: element.getAttribute("tags")?.split(","), scale, noframe, order, render: element.getAttribute("render"), thumbRender: element.getAttribute("thumb-render")})
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
            loading.className = "g-gridCellLoading";
            return loading;
        },
        effect: ({self}) => {
            // Effect
            let effect = document.createElement("div");
            effect.className = "g-gridCellEffect";
            if (!self.smallLightboxEnabled) effect.classList.add("g-smallScreenHide");
            return effect;
        },
        btn: ({self, index}) => {
            // Button to open lightbox
            let btn = document.createElement("button");
            btn.className = "g-gridCellButton";
            if (!self.smallLightboxEnabled)  btn.classList.add("g-smallScreenHide");
            btn.onclick = () => {
                self.setLightbox(index);
            };
            return btn;
        },
        img: ({source}) => {
            // Image
            let img = source.element ?? document.createElement("img");
            img.style.display = '';
            img.src = GalleryHandler.getCellImage(source);
            img.className = "g-gridCellImage";
            if (source.thumbRender) img.style.imageRendering = source.thumbRender
            else if (source.render) img.style.imageRendering = source.render;
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
            effect.className = "g-gridCellEffect rm-pause";
            if (!self.smallLightboxEnabled) effect.classList.add("g-smallScreenHide");
            return effect;
        },
        img: ({source}) => {
            // Image
            let img = source.element ?? document.createElement("img");
            img.style.display = '';
            img.src = GalleryHandler.getCellImage(source);
            img.className = "g-gridCellImage";
            if (source.thumbRender) img.style.imageRendering = source.thumbRender
            else if (source.render) img.style.imageRendering = source.render;
            return img;
        },
        btn: ({self, index}) => {
            // Button to open lightbox
            let btn = document.createElement("button");
            btn.className = "g-gridCellButton";
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
        allowOpenFromRandom = false, 
        smallLightboxEnabled = true,
        captions = Defaults.CAPTIONS,
        hideTags = false,
        extra = {}}) {

        var self = this;

        // Sources
        this.sources = sources;
        this.sources.sort((a, b) => a.order > b.order);

        // Indexing
        this.curr = -1;

        // Buttons
        this.prevButton = document.getElementById("lb_prev");
        this.nextButton = document.getElementById("lb_next");
        this.randButton = document.getElementById("lb_randomButton");
        this.allowOpenFromRandom = allowOpenFromRandom;

        // Grid
        this.gridEl;
        this.maxRowHeight;
        this.smallMaxRowHeight;
        this.refreshGrid = () => {};

        // Variables
        this.focused = false;
        this.smallLightboxEnabled = smallLightboxEnabled; // Whether or not the lightbox is enabled for small screens
        this.captions = captions; // Whether or not description is embed on cells
        this.hideTags = hideTags; // Whether or not to show tags in lightbox
    
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

        Lightbox.openWith({...source, tags: this.hideTags ? undefined : source.tags, imgScale: source.scale})

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
        const index = this.getIndex(id);
        if (index === -1) {
            console.warn("Could not find image with id "+id);
            return;
        }
        this.setLightbox(index);
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
                if (self.focused || self.allowOpenFromRandom) self.randomLightbox();
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

            if (e.key == Keybinds.RANDOM && (self.allowOpenFromRandom || self.focused)) {
                self.randomLightbox();
            }
        });
    }

    /** Returns the size of the source array. */
    getSourceSize() {
        return this.sources.length;
    }

    /** Returns the image to use for the grid cell. */
    static getCellImage(source) {
        if (source.thumb) return source.thumb;
        return source.img;
    }

    /** 
     * Initializes a fixed grid using the view sources. 
     * @param parent element to add grid to
     * @param width target fixed width for cell
     * @param height target fixed height for cell
     * @param smallFillWidth whether or not cells fill the width of a small screen
     */
    initializeFixedGrid(parent, {width, height, smallFillWidth}) {
        var self = this;
        this.gridEl = document.createElement("div");
        parent.appendChild(this.gridEl);

        this.generateFixedGrid(width, height, {smallFillWidth});
        this.refreshGrid = () => { 
            self.generateFixedGrid(width, height, {smallFillWidth}); 
        }
    }

    /** 
     * Generates fixed grid. 
     * @param width target fixed width for cell
     * @param height target fixed height for cell
     * @param smallFillWidth whether or not cells fill the width of a small screen
     */
    generateFixedGrid(width, height, {smallFillWidth}) {
        var self = this;
        this.gridEl.innerHTML = '';
        this.gridEl.classList.add("g-grid");
        this.gridEl.classList.add("g-fixedGrid");

        let cellRect;

        for (let i = 0; i < this.sources.length; i++) {
            let source = this.sources[i];

            let cell = document.createElement("div");
            cell.className = "g-gridCell";
            if (smallFillWidth) cell.classList.add("g-smallFillWidth");
            cell.style.width = `${width}px`;
            cell.style.height = `${height}px`;
            cell.style.aspectRatio = `${width}/${height}`;

            const cellElements = {};
            for (const [key, gen] of Object.entries(GalleryHandler.fixedCellElementGen)) {
                const cellElement = gen({self: self, source: source, index: i});
                cellElements[key] = cellElement
                if (cellElement && key !== "btn" && key !== "img") {
                    cell.appendChild(cellElement);
                }
            }

            cell.append(cellElements["btn"], cellElements["img"]);
            if (source.noframe) cell.classList.add("g-noframe");
            cellElements["img"].onload = () => {
                cellElements["loading"].style.display = "none";
            }

            this.gridEl.appendChild(cell);
            if (!cellRect) cellRect = cell.getBoundingClientRect();
        }
    }

    /** 
     * Initializes with justified grid with variable width and height. \
     * @param parent element to add grid to
     * @param maxRowHeight max height for row
     * @param smallMaxRowHeight max height for row for small screens
     * @param smallFillWidth whether or not cells fill the width of a small screen
     */
    initializeJustifiedGrid(parent, {maxRowHeight, smallMaxRowHeight, smallFillWidth}) {
        var self = this;
        this.gridEl = document.createElement("div");
        parent.appendChild(this.gridEl);
        this.maxRowHeight = maxRowHeight;
        this.smallMaxRowHeight = smallMaxRowHeight;

        self.refreshGrid = () => {};

        self.generateJustifiedGrid(this.maxRowHeight, {smallFillWidth});

        addEventListener("resize", function () {
            self.refreshGrid();
        });
        self.refreshGrid = () => {
            self.generateJustifiedGrid(this.maxRowHeight, {smallFillWidth});
        }
    }

    /** 
     * Generates with justified grid. 
     * @param maxRowHeight max height for row
     * @param smallFillWidth whether or not cells fill the width of a small screen
     */
    generateJustifiedGrid(maxRowHeight, {smallFillWidth}) {
        var self = this;
        var gridWidth = self.gridEl.clientWidth;
        
        if (Lightbox.isSmallScreen()) {
            maxRowHeight = self.smallMaxRowHeight ?? smallScreenWidth;
        }

        /**
         * Adds item (cell) to row.
         * Returns image, with its extra width and height.
         */
        function addItem(source, index, row) {
            let cell = document.createElement("div");
            cell.className = "g-gridCell";

            let extraWidth = 0;
            let extraHeight = 0;

            const cellElements = {};
            for (const [key, gen] of Object.entries(GalleryHandler.justifiedCellElementGen)) {
                const cellElement = gen({self: self, source: source, index: index});
                cellElements[key] = cellElement;

                if (key === "img") {
                    const imgOuterSizes = GalleryHandler.getOuterSize(cellElement);
                    extraWidth += imgOuterSizes.outerWidth;
                    extraHeight += imgOuterSizes.outerHeight;
                }

                if (cellElement) cell.appendChild(cellElement);
            }

            const cellOuterSizes = GalleryHandler.getOuterSize(cell);
            extraWidth += cellOuterSizes.outerWidth;
            extraHeight += cellOuterSizes.outerHeight;

            if (source.noframe) cell.classList.add("g-noframe");
            row.appendChild(cell);

            // Normalized to 100px height --- dh/h * w = dw
            const normalizedHeight = 100;
            const normalizedWidth = (100/(source.imgHeight)) * source.imgWidth;

            return {extraWidth, extraHeight, normalizedHeight, normalizedWidth};
        }
  
        /** Adds row to grid */
        function addRow(rowHeight) {
            const newRow = currRow;

            newRow.style.width = `${gridWidth}px`
            newRow.style.height = `${rowHeight}px`;
            newRow.className = "g-justifiedGridRow";
            newRow.style.maxHeight = `${maxRowHeight}px`;
            newRow.style.maxWidth = `${gridWidth * (maxRowHeight / rowHeight)}px`;
            if (smallFillWidth) newRow.classList.add("g-smallFillWidth");

            self.gridEl.appendChild(newRow);
            rows.push(newRow);

            currRow = document.createElement("div");
            return {newRow};
        }
  
        // Clears grid
        self.gridEl.textContent = "";

        self.gridEl.classList.add("g-grid");
        self.gridEl.classList.add("g-justifiedGrid");
        var currRow = document.createElement("div");
        var imageData = [];
        var rowHeight = 0;

        var rows = [];

        // Iterates through all sources
        let currGridHeight = 0;
        for (let i = 0; i < self.sources.length; i++) {
            let source = self.sources[i];
            if (source.imgWidth && source.imgHeight) {
                const itemResult = addItem(source, i, currRow);
                imageData.push({src: source, ...itemResult});

                // Calculate new row height --- dw/w * h = dh
                const desiredWidth = gridWidth - imageData.reduce((sum, data) => sum + data.extraWidth, 0);
                rowHeight = desiredWidth/imageData.reduce((sum, data) => sum + data.normalizedWidth, 0) * itemResult.normalizedHeight;
                rowHeight += itemResult.extraHeight;

                if (rowHeight <= maxRowHeight) {
                    const rowResult = addRow(rowHeight);
                    currGridHeight += rowResult.itemHeight;
                    rowHeight = 0;
                    imageData = [];
                }
            } else {
                console.error(`Missing width and height data for ${source.img}`);
            }
        }
        if (self.sources.length > 0) addRow(rowHeight);
    }

    /* Returns outer sizing of an element (borders, padding, and margin). */
    static getOuterSize(element) {
        let outerWidth = 0;
        let outerHeight = 0;

        // Temporarily add to body to get computed style
        document.getElementsByTagName("body")[0].appendChild(element);

        // Borders
        outerWidth += element.offsetWidth - element.clientWidth;
        outerHeight += element.offsetHeight - element.clientHeight;

        // Margins
        const computedStyle = window.getComputedStyle(element);
        outerWidth += parseFloat(computedStyle.marginLeft) + parseFloat(computedStyle.marginRight);
        outerHeight += parseFloat(computedStyle.marginTop) + parseFloat(computedStyle.marginBottom);

        // Padding
        outerWidth += parseFloat(computedStyle.paddingLeft) + parseFloat(computedStyle.paddingRight);
        outerHeight += parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);

        return {outerWidth, outerHeight}
    }

    /** Updates the lightbox sources and refreshes. */
    updateSources(sources = this.sources) {
        this.sources = sources;
        GalleryHandler.onSourcesChanged(this, sources);
    }
}

/* Gallery component */
class GalleryGrid extends HTMLElement {
    static observedAttributes = [
        "id", 
        "gridtype", 
        "maxperpage", 
        "cellwidth", 
        "cellheight", 
        "maxrowheight", 
        "captions", 
        "hidetags", 
        "ascending",
        "small-fillwidth",
        "small-maxrowheight", 
        "small-lbdisabled",
        "filters", 
        "sort"
    ];

    static ids = [];
    static idCounter = 0;

    constructor() {
        super();
        this.gridInitialized = false;
        
        this.gridType;
        this.galleryHandler;
        this.sources = [];

        this.page = 1;
        this.maxPerPage;
        this.pageNav;
        this.pageNavNum;
        this.pagePrevButton;
        this.pageNextButton;

        this.filters;
        this.includeFilters = [];
        this.sort;
        this.sorting;
        this.ascending = false;
    }

    connectedCallback() {
        // Set id (and generate one if none)
        if (!this.id) {
            this.id = GalleryGrid.idCounter.toString();
            while (GalleryGrid.ids.includes(this.id)) {
                GalleryGrid.idCounter++;
                this.id = GalleryGrid.idCounter.toString();
            }
            GalleryGrid.idCounter++;
        } else if (this.id && GalleryGrid.ids.includes(this.id)) {
            while (GalleryGrid.ids.includes(this.id)) {
                GalleryGrid.idCounter++;
                this.id += '_' + GalleryGrid.idCounter.toString();
            }
        }
        GalleryGrid.ids.push(this.id);

        // Get grid type (or guess it)
        if (!this.getAttribute("gridtype")) {
            this.gridType = Defaults.GRID_TYPE;
            if (this.getAttribute("cellwidth" || this.getAttribute("cellheight"))) this.gridType = "fixed";
            if (this.getAttribute("maxrowheight")) this.gridType = "justified";
        } else {
            this.gridType = this.validateSelection("gridtype", VALID_GRIDTYPES, Defaults.GRID_TYPE);
        }

        this.addAll(this.children)
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
            console.warn(`Invalid ${valueName} - Accepted values: ${acceptedValues.join(", ")}`);
            return defaultValue;
        }

        return value;
    }

    validateBoolean(valueName) {
        const value = this.getAttribute(valueName)
        return value === null ? false : value !== "false";
    }

    initializeGrid() {
        this.innerHTML = "";

        // Generate grid
        this.maxPerPage = this.validateNumber("maxperpage", Defaults.MAX_PER_PAGE);
        var width = this.validateNumber("cellwidth", Defaults.CELL_WIDTH);
        var height = this.validateNumber("cellheight", Defaults.CELL_HEIGHT);
        var maxRowHeight = this.validateNumber("maxrowheight", Defaults.MAX_ROW_HEIGHT);

        // Small screen attributes
        var smallFillWidth = this.validateBoolean("small-fillwidth");
        var smallMaxRowHeight = this.validateNumber("small-maxrowheight", this.validateNumber("maxrowheight", Defaults.SMALL_MAX_ROW_HEIGHT));
        var smallLbDisabled = this.validateBoolean("small-lbdisabled");

        // Sifter attributes
        this.filters = this.validateSelection("filters", VALID_FILTERS, Defaults.FILTERS);
        this.sort = this.validateSelection("sort", VALID_SORTS, Defaults.SORT)
        if (this.getAttribute("ascending") === null && this.sort == "alphabetical") {
            this.ascending = true;
        } else this.ascending = this.validateBoolean("ascending");

        // Other attributes
        var captions = this.validateSelection("captions", VALID_CAPTIONS, Defaults.CAPTIONS);
        var hideTags = this.validateBoolean("hidetags");

        // Sort sources
        this.sources.sort((a, b) => a.order > b.order);

        // Create sorts and filters options (if applicable)
        const sifterDiv = document.createElement("div");
        sifterDiv.className = "g-sifterWrapper";
        if (this.filters === "none" && this.sort === "none") sifterDiv.style.display = "none";
        
        // Filters
        if (this.filters !== "none") {
            const filterList = [];

            if (this.filters === "tags") {
                let hasUntaggedSources = false;
                this.sources.forEach((source) => {
                    if (source.tags) {
                        source.tags.forEach((tag) => {
                            if (!filterList.includes(tag)) filterList.push(tag);
                        });
                    } else hasUntaggedSources = true;
                });
                filterList.sort((a,b) => a > b);
                if (hasUntaggedSources) filterList.push(undefined);
            }

            const filterWrapper = document.createElement("div");
            filterWrapper.className = 'g-filters g-sifter';
            filterWrapper.innerHTML = `<span class='g-sifterName'>Filters</span>`;
            const inputs = document.createElement("div");
            inputs.className = "g-inputs";
            filterWrapper.appendChild(inputs);

            filterList.forEach((filter) => {
                const filterInput = document.createElement("input");
                filterInput.className = 'g-filterInput';
                filterInput.name = `${this.id}_filter`;
                filterInput.type = 'checkbox';
                filterInput.checked = true;

                const filterName = document.createElement('span');
                filterName.className = filter ? '' : 'g-filterInputOther';
                filterName.textContent = filter ?? '';

                const inputWrapper = document.createElement("div");
                inputWrapper.className = 'g-inputWrapper';

                inputWrapper.appendChild(filterInput);
                inputWrapper.appendChild(filterName);
                inputs.appendChild(inputWrapper);

                this.includeFilters.push(filter);

                filterInput.onchange = () => {
                    if (!filterInput.checked) {
                        this.includeFilters = this.includeFilters.filter((f) => f !== filter);
                    } else this.includeFilters.push(filter);
                    this.applySourceChanges()
                }
            });

            sifterDiv.appendChild(filterWrapper);
        }

        // Sorts
        if (this.sort !== "none") {
            this.sorting = this.ascending ? "ascending" : "descending";

            const sortWrapper = document.createElement("div");
            sortWrapper.className = 'g-sort g-sifter';
            if (this.sort === "alphabetical") sortWrapper.classList.add('g-sortAlphabetical');
            sortWrapper.innerHTML = `<span class='g-sifterName'>Sort</span>`;
            const inputs = document.createElement("div");
            inputs.className = "g-inputs";
            sortWrapper.appendChild(inputs);

            const sortOptions = ["ascending", "descending"]

            sortOptions.forEach((sortOption, i) => {
                let isAscending = i == 0;
                const sortInput = document.createElement("input");
                sortInput.className = `g-sortInput`;
                sortInput.name = `${this.id}_sort`;
                sortInput.type = 'radio';
                sortInput.checked = this.ascending ? i == 0 : i == 1;

                const sortName = document.createElement('span');
                sortName.className = `g-sortInput${sortOption.charAt(0).toUpperCase() + sortOption.substring(1)}`;

                sortInput.onchange = () => {
                    if (sortInput.checked) {
                        if (isAscending) this.sorting = "ascending";
                        else this.sorting = "descending";
                        this.applySourceChanges();
                    }
                }

                const inputWrapper = document.createElement("div");
                inputWrapper.className = 'g-inputWrapper';
                inputWrapper.appendChild(sortInput);
                inputWrapper.appendChild(sortName);
                inputs.appendChild(inputWrapper);
            });

            sifterDiv.appendChild(sortWrapper);
        }

        this.appendChild(sifterDiv);

        // Create grid
        this.galleryHandler = new GalleryHandler(this.sources, {smallLightboxEnabled: !smallLbDisabled, captions, hideTags});

        if (this.gridType == "fixed") {
            this.galleryHandler.initializeFixedGrid(this, {
                width: width, 
                height: height,
                smallFillWidth
            })
        } else if (this.gridType == "justified") {
            this.galleryHandler.initializeJustifiedGrid(this, {smallMaxRowHeight, maxRowHeight, smallFillWidth})
        }

        // Create page nav (if applicable)
        if (this.maxPerPage) {
            const pageCount = Math.max(Math.floor(this.sources.length / this.maxPerPage) + ((this.sources.length % this.maxPerPage) !== 0 ? 1 : 0), 1)
            this.pageNav = document.createElement("div");
            this.pageNav.className = "g-pageNav";

            this.pagePrevButton = document.createElement("button");
            this.pagePrevButton.className = "g-pageNavPrev g-pageNavButton";
            this.pageNav.appendChild(this.pagePrevButton);
            this.pagePrevButton.onclick = () => {
                this.page = Math.max(1, this.page - 1);
                this.applySourceChanges();
            }

            this.pageNavNum = document.createElement("span");
            this.pageNavNum.className = 'g-pageNavNum';
            this.pageNav.appendChild(this.pageNavNum);

            this.pageNextButton = document.createElement("button");
            this.pageNextButton.className = "g-pageNavNext g-pageNavButton";
            this.pageNav.appendChild(this.pageNextButton);
            this.pageNextButton.onclick = () => {
                this.page = Math.min(pageCount, this.page + 1);
                this.applySourceChanges();
            }

            this.appendChild(this.pageNav);
        }

        this.gridInitialized = true;
        this.applySourceChanges();
    }

    applySourceChanges() {
        var changedSources = [...this.sources];

        // Apply filters
        if (this.filters !== "none" && this.includeFilters) {
            changedSources = this.sources.filter((source) => {
                let include = false;
                source.tags?.forEach((tag) => {
                    if (this.includeFilters.includes(tag)) include = true;
                });
                if (!source.tags && this.includeFilters.includes(undefined)) {
                    include = true;
                }
                return include;
            })
        }

        // Apply sorts
        if (this.sort == "none" && this.ascending ) {
            changedSources = changedSources.reverse();
        }
        if (this.sort && this.sort == "default") {
            if (this.sorting === "ascending") {
                changedSources = changedSources.reverse();
            }
        } else if (this.sort && this.sort == "alphabetical") {
            if (this.sorting === "ascending") {
                changedSources = changedSources.sort((a, b) => {
                    if (!b.title) return true;
                    return a.title > b.title
                });
            } else {
                changedSources = changedSources.sort((a, b) => {
                    if (!a.title) return true;
                    return a.title <= b.title
                })
            }
        }

        // Apply pagination
        if (this.maxPerPage) {
            const pageCount = Math.max(Math.floor(changedSources.length / this.maxPerPage) + ((changedSources.length % this.maxPerPage) !== 0 ? 1 : 0), 1)
            this.page = Math.min(this.page, pageCount);
            this.pageNavNum.textContent = `${this.page}/${pageCount}`;
            this.pagePrevButton.disabled = this.page === 1;
            this.pageNextButton.disabled = this.page === pageCount;
            this.galleryHandler.updateSources(changedSources.slice(((this.page - 1) * this.maxPerPage), (this.page * this.maxPerPage)));
        } else {
            this.galleryHandler.updateSources(changedSources);
        }
    }

    addAll(imgEls) {
        var promises = [];
        let order = 0;

        Array.from(imgEls).forEach((child) => {
            if (child.tagName.toLowerCase() !== "img") console.warn("Non-image element in gallery grid ");
            const res = this.add(child, order, false);
            if (res) promises.push(res);
            order++;
        });

        if (!this.gridInitialized) Promise.all(promises).then(() => this.initializeGrid())
        else this.applySourceChanges();
    }

    add(imgEl, order = 0, refresh = true) {
        if (!imgEl.getAttribute("src")) {
            console.error("Image is missing src URL.")
            return;
        }
        imgEl.style.display = "none";

        const cellOrder = imgEl.getAttribute("order") ?? order;
        const doRefresh = this.gridInitialized && refresh;

        if (this.gridType === "fixed") {
            this.sources.push(GallerySource.fromElement(imgEl, {order: cellOrder}));
            if (doRefresh) this.applySourceChanges();
        } else {
            if (imgEl.width && imgEl.height) {
                this.sources.push(GallerySource.fromElement(imgEl, {width: imgEl.width, height: imgEl.height, order: cellOrder}));
                if (doRefresh) this.applySourceChanges();
            } else {
                const cellImage = new Image();
                cellImage.src = imgEl.getAttribute("thumb") ?? imgEl.getAttribute("src");
                const loadPromise = new Promise((resolve) => {
                    cellImage.onload = () => resolve(true);
                    cellImage.onerror = () => {
                        if (imgEl.getAttribute("thumb")) {
                            console.error("Thumbnail url is invalid.")
                        } else console.error("Image url is invalid.")
                        resolve(false);
                    }
                })
                loadPromise.then((success) => {
                    if (success) {
                        this.sources.push(GallerySource.fromElement(imgEl, {width: cellImage.naturalWidth, height: cellImage.naturalHeight, order: cellOrder}));
                        if (doRefresh) this.applySourceChanges();
                    }
                });
                return loadPromise;
            }
        }
    }

    clear() {
        if (!this.gridInitialized) {
            console.warn("Cannot clear grid before initialization");
            return;
        }
        this.sources = [];
        this.applySourceChanges();
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
                <button id="lb_smallExitButton"></button>
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

/* --- Modifications below this line --- */

// Retrieves image source while respecting reduced motion setting. */
function getImgSource(imgSrc) {
    const currentSetting = localStorage.getItem("reducedmotion") === "true" ? true : false;
    if (currentSetting && imgSrc.endsWith(".gif")) {
        // Preload animated image
        var img = new Image();
        img.src = imgSrc;
        return "/static"+imgSrc;
    }
    return imgSrc;
}

Lightbox.getImgSource = (imgSrc) => {
    return getImgSource(imgSrc);
};
GalleryHandler.getCellImage = (source) => {
    const processImage = source.thumb ?? source.img;
    return getImgSource(processImage);
}

// Adds play icon to show on cells with animated images to grid cell generation
const genPlayIcon = ({source}) => {
    if (source.img.endsWith(".gif")) {
        let play = document.createElement("div");
        play.className = "g-gridCellPlay";
        let playImg = document.createElement("img");
        playImg.src = "/svg/play-hollow.svg";
        play.appendChild(playImg);
        return play;
    }
}
GalleryHandler.justifiedCellElementGen["playIcon"] = genPlayIcon
GalleryHandler.fixedCellElementGen["playIcon"] = genPlayIcon

// Pagination
GalleryHandler.onStart = (handler, {paging}) => {
    if (!paging) return;
    handler.origSources = [...handler.sources];

    // Set source range
    if (paging.loadLimit) {
        handler.loadLimit = paging.loadLimit;
        handler.sources = handler.sources.slice(0, paging.loadLimit);
    }

    // Pagination
    handler.pg = new Pagination({
        navId: paging.pageNavId, 
        infoId: paging.pageInfoId, 
        loadLimit: paging.loadLimit, 
        sourceSize: handler.origSources.length,
        queryEnabled: paging.pageQueryEnabled,
        infScrollEnabled: paging.infScrollEnabled,
        infScroll: false,
        scrollToTop: paging.scrollToTop,
        onUpdate: () => {
            // Load view sources with given start index and load limit.
            if (handler.pg) {
                handler.sources = [...handler.origSources];
                if (!handler.pg.infScroll) {
                    const viewRange = handler.pg.getSourceRange();
                    handler.sources = handler.sources.slice(viewRange.start, viewRange.end);
                }
                handler.refreshGrid();
            }
        }
    });
    
    if (handler.pg) handler.pg.update();

    // Pause/unpause page controls while lightbox is open/closed
    Lightbox.setOnLightboxOpenEvent(() => {
        if (handler.pg) handler.pg.controlsPaused = true;
    });
    Lightbox.setOnLightboxCloseEvent(() => {
        if (handler.pg) handler.pg.controlsPaused = false;
    });
}

GalleryHandler.onSourcesChanged = (handler, sources) => {
    handler.origSources = [...sources];
    if (handler.loadLimit) handler.origSources.slice(0, handler.loadLimit);
    if (handler.pg) {
        handler.pg.updateSource(handler.origSources.length);
    } else {
        handler.refreshGrid();
    }
}
