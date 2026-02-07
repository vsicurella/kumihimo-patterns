function contrastingColor(p5, color)
{
    if (p5.lightness(color) > 50)
        return p5.color(0)
    return p5.color(255)
    
}

function getHexPoints(rx, ry, phase=0)
{
    const points = [];
    const step = 2*Math.PI/6;
    for (var n = 0; n < 6; n++)
    {
        const theta = step * n + phase;
        points.push(
        {
            x: Math.cos(theta) * rx,
            y: Math.sin(theta) * ry
        });
    }
    return points;
}

function updateThreadsInput(value)
{
    numThreadsInput.value = value;
}

class BraidDesigner extends BraidControls
{
    currentPattern = PATTERNS.NaikiGumi;

    edits = [];
    redoIndex = -1

    // graphics stuff (may move to a viewer class)
    previewWidth = 0
    previewHeight = 0

    constructor()
    {
        super(new Braid(16))

        const colorPicker = document.getElementById("color-picker");
        this.picker = AColorPicker.createPicker(colorPicker, { showRGB: true, showHSL: false });
        this.picker.on('change', (picker, color) => this.currentColor = color)
    }

    _add_undoable_edit_(edit)
    {
        this.edits.splice(0, this.redoIndex, edit);
        this.redoIndex = 0;
    }

    resetCanvases()
    {
        patternSketch.remove();
        patternSketch = new p5(PatternSketch);

        colorSketch.remove();
        colorSketch = new p5(ColorSketch)
    }

    numThreads()
    {
        return this.braid.size;
    }

    getPaletteColor(index)
    {
        return this.braid.color(index);
    }

    setTechnique(technique)
    {
        app.currentPattern = technique;

        if (this.sketch){
            this.sketch.storeItem('kumihimo-technique', technique);
            const input = document.getElementById('pattern-select');
            input.value = technique;
        }

        const threadNumInput = document.getElementById('num-threads-input');
        if (technique === PATTERNS.KongoGumi)
        {
            // make sure controls are restricted
            if ((app.numThreads() / 2) % 2 == 1)
            {
                this.setNumThreads(app.numThreads() - 2);
                threadNumInput.value = app.numThreads();
            }

            threadNumInput.step = 4;
        }
        else
        {
            threadNumInput.step = 2;
        }
    }

    setNumThreads(num)
    {
        if (app.braid.size === num)
            return;

        const previous = app.braid.size;
        app.braid = new Braid(num);

        this.sketch.storeItem('kumihimo-num-threads', num);

        this.resetCanvases();

        this._add_undoable_edit_(Edit.SetNumThreads(num, previous));
    }

    setThreadColor(thread, color)
    {
        const oldColor = this.braid.color(thread);
        this.setColor(thread, color);
        this._add_undoable_edit_(Edit.SetColor(thread, color, oldColor));
    }

    rotateColorsClockwise()
    {
        this.rotatePalette(-1);
        this._add_undoable_edit_(Edit.RotateColors(-1));
    }

    rotateColorsCounterClockwise()
    {
        this.rotatePalette(1);
        this._add_undoable_edit_(Edit.RotateColors(1));
    }

    paintAllThreads()
    {
        const currentPalette = [...this.braid.palette];
        const newPalette = this.braid.palette.map(() => this.currentColor);
        this.setPalette(newPalette)
        this._add_undoable_edit_(Edit.SetPalette(newPalette, currentPalette));
    }

    toggleThreadNums()
    {
        this.showThreadNums = !this.showThreadNums;
    }

    undo()
    {
        if (this.edits.length == 0 || this.redoIndex >= this.edits.length)
            return;

        const toUndo = this.edits[this.redoIndex];
        this._perform_edit_(toUndo.type, toUndo.oldValue);
        this.redoIndex++;
    }

    redo()
    {
        if (this.edits.length == 0 || this.redoIndex <= 0)
            return;

        const toRedo = this.edits[this.redoIndex - 1];
        this._perform_edit_(toRedo.type, toRedo.newValue);
        this.redoIndex--;
    }

    _perform_edit_(editType, value)
    {
        switch (editType)
        {
        case EditType.SetColor:
            this.setColor(value.thread, value.color)
            break;
        case EditType.RotateColors:
            this.rotatePalette(value)
            break;
        case EditType.SetNumThreads:
            app.braid = new Braid(value);
            this.resetCanvases();
            updateThreadsInput(app.braid.size);
            break;
        case EditType.SetPalette:
            this.setPalette(value)
            break;
        default:
            throw new Error("Unknown edit: " + editType, value);
        }
    }

    loadState(state)
    {
        this.setPalette(state.palette)
        this.setNumThreads(state.numThreads)
    }

    loadFile(name, blob)
    {
        // console.log('loadFile', name, blob)
        const reader = new FileReader();
        reader.readAsText(blob);
        reader.onerror = () => {
            const msg = document.getElementById('load-file-message');
            msg.innerText = 'Error opening file, unknown issue.';
            }
        reader.onload = () =>
            {
            const msg = document.getElementById('load-file-message');

            try {
                const state = JSON.parse(reader.result);
                this.loadState(state)
                msg.innerText = 'Loaded ' + name;
                }
            catch (err)
                {
                msg.innerText = 'Error loading file, wrong type or corrupted.';
                }
            }
    }

    load()
    {
        const fileInput = document.getElementById('load-file');
        fileInput.oninput = (ev) => this.loadFile(
            ev.target.value, ev.target.files[0]
        )
        fileInput.click();
    }

    saveStateToFile(name, state)
    {
        const data = JSON.stringify(state);
        const blob = new Blob([data], { type: 'application/json' })
        const url = URL.createObjectURL(blob);
        
        const download = document.getElementById('save-file');
        download.download = (name || 'kumihimo-pattern') + '.json';
        download.href = url;
        download.click();
    }

    save()
    {
        const state =
            {
            numThreads: this.numThreads(),
            palette: this.braid.palette
            }

        this.saveStateToFile('', state);
    }

    screenshot(name)
    {
        // pretty messy!

        const srcScaling = 2; // unsure why we need this

        const labelMargins = (this.radius*this.labelScalar) - this.radius;
        // const patternSize = this.radius*2 + labelMargins * 2;
        const patternSize = this.patternWidth;
        const margins = 25;

        const canvas = document.getElementById('screenshot');
        canvas.width = this.previewWidth + (patternSize/2) + margins * 2;
        canvas.height = this.previewHeight + margins * 2;

        const ctx = canvas.getContext('2d');

        const preview = document.getElementById('preview-canvas');
        const pattern = document.getElementById('pattern-canvas');

        // const previewSrcX = (preview.width-this.previewWidth)*0.5/srcScaling;
        const previewSrcX = 20;

        ctx.fillStyle = '#f0f0f0'
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(preview, 
            previewSrcX, 0, this.previewWidth*srcScaling, this.previewHeight*srcScaling, 
            margins, margins, this.previewWidth, this.previewHeight);
        ctx.drawImage(pattern, 
            this.cx-this.radius - labelMargins, this.cy-this.radius - labelMargins, patternSize*srcScaling, patternSize*srcScaling, 
            300, labelMargins, patternSize, patternSize);

        ctx.fillStyle = 'black'
        ctx.font = "32px serif"
        const ptw = ctx.measureText(app.currentPattern);
        ctx.fillText(app.currentPattern, 300 + this.cx - (ptw.width * 0.5), this.cy-16);

        const threadsText = app.numThreads() + " threads";
        const ttw = ctx.measureText(threadsText);
        ctx.fillText(threadsText, 300 + this.cx - (ttw.width * 0.5), this.cy+16)

        const url = canvas.toDataURL('image/png');
        const download = document.getElementById('save-file');
        download.download = (name || 'kumihimo-pattern-preview') + '.png'
        download.href = url;
        download.click();
    }
}

const PatternSketch = (p5) => {

    hexPoints = null;

    style = null;
    styleParity = 1;
    unitSize = 15;
    patternStyle = 'hex';

    times = 0

    resetPattern = () => {
        let savedColors = []
        for (let t = 0; t < app.numThreads(); t++)
        {
            let color = p5.getItem(braidColorKey(t));
            if (color == null)
                color = 0;
            savedColors.push(color);
        }

        app.setPalette(savedColors);
    }

    p5.setup = () => {
        const area = document.getElementsByClassName('pattern-preview')[0];
        const canvas = p5.createCanvas(area.clientWidth, area.clientHeight);
        canvas.parent(area);
        canvas.elt.id = 'preview-canvas'

        p5.colorMode('rgb')

        resetPattern();
    };

    p5.draw = () => {
        p5.background('#f0f0f0')

        p5.textAlign(p5.CENTER)

        switch (app.currentPattern)
        {
        case PATTERNS.KongoGumi:
            style = 'kongo-gumi'
            patternStyle = 'hex'
            break;
        case PATTERNS.NaikiGumi:
            style = 'plain-weave'
            styleParity = 1;
            patternStyle = 'rhombus'
            break;
        case PATTERNS.NaikiGaeshi:
            style = 'plain-weave'
            styleParity = 2;
            patternStyle = 'hex'
            break;
        default:
            p5.text("Unknown pattern: " + app.currentPattern, p5.width/2, p5.height/2);
            return;
        }

        let unitWidth = unitSize;
        let unitHeight = unitSize;
        let tx = 1;
        let ty = 1;

        switch (patternStyle)
        {
        case 'square':
            break;
        case 'rhombus':
            unitHeight = unitSize * 3 / 2;
            break;
        case 'hex':
            unitHeight = unitSize * 9 / 8;
            hexPoints = getHexPoints(unitWidth, unitHeight, Math.PI/6);
            tx = Math.sqrt(3)/2;
            ty = 1.5;
            break;
        }

        let patternWidth = unitWidth * (app.numThreads() + 0.5);
        let patternHeight = unitHeight * (app.numThreads() * 2);

        if (patternStyle == 'hex')
        {
            patternWidth = unitWidth * Math.sqrt(3) * (app.numThreads() + 0.5)
        }

        app.previewWidth = patternWidth;
        app.previewHeight = patternHeight;

        // const origin = { x: p5.abs(p5.width - patternWidth) * 0.5, y: 20 };
        const origin = { x: 20, y: 20 };

        const numRows = app.numThreads();
        const numCols = app.numThreads() / 2;

        // const direction = 0; // s direction
        // const direction = 1; // z direction

        const kgEvens = app.numThreads()/2 + 3;
        const kgOdds = -1;

        const halfThreads = app.numThreads() / 2;

        let kgSequence = [];
        let kgMap = {};
        if (style == 'kongo-gumi')
        {
            offset = 2;
            
            const fourth = app.numThreads() / 4;
            const half = app.numThreads() / 2;
            for (var n = 0; n < app.numThreads(); n++)
            {
                kgSequence.push(
                    (n % fourth) * 2 + Math.floor(n/fourth) % 2 + Math.floor(n/half)*half
                );
                kgMap[kgSequence[n]] = n;
            }
            if (times < 1)
            {
                console.log(kgOdds, kgEvens);
                console.log(kgSequence.map(x=>x+1))
                console.log(kgMap)
            }
        }
        

        for (let row = 0; row <= numRows; row++)
        {
            for (let col = 0; col < numCols; col++)
            {
                const centerX = origin.x + tx * unitWidth * (col * 2 + 1 + p5.pow(0, row % 2));
                const centerY = origin.y + ty * unitHeight * (row + 1);

                let thread = -1;
                let start = -1;
                const numCycles = Math.floor(row/(app.numThreads()*2));
                const numQuarterCycles = Math.floor(row/(app.numThreads()/2));

                switch (style)
                {
                case 'kongo-gumi':
                {
                    if (numQuarterCycles % 2 == 0)
                    {
                        start = 1 + Math.floor((row+1)/2) * kgOdds 
                                  + Math.floor(row/2) * kgEvens 
                                //   + direction * 4
                    }
                    else
                    {
                        start = Math.floor(row/2) 
                              + Math.floor((row+1)/2) * (halfThreads+1) 
                              - Math.floor(numCycles/2)
                            //   + direction * 2
                    }

                    // start += row * 2 * direction;

                    if (Math.floor(numQuarterCycles/2) % 2 == 1)
                    {
                        start += halfThreads;
                    }

                    // start = (app.numThreads() - start) % app.numThreads() + app.numThreads();
                    start = start % app.numThreads();
                    // if (numQuarterCycles == 1)
                    //     start = NaN

                    // if (direction > 0)
                    //     start = 16 - start

                    const startMap = kgMap[start % app.numThreads()];
                    const index = (startMap + col) % app.numThreads();
                    thread = kgSequence[index];

                    break;
                }
                case 'plain-weave':
                {
                    // basic cross stitch pattern, squares rotated by 45 degrees
                    if (row % 2 == 0) // evens (shown as odds)
                    {
                        thread = ((app.numThreads() * styleParity) - row * styleParity + 2 * col) % app.numThreads()
                    }
                    else // odds (shown as evens)
                    {
                        thread = ((row - 1) * styleParity + 2 * col + 1) % app.numThreads()
                    }
                }
                break;

                default:
                    p5.text("Pattern not implemented", p5.width/2,p5.height/2)
                    return;
                }

                let text = thread + 1;
                // text = numCycles
                // text = (Math.floor((row+1)/2) * kgodds) % 16;
                // text = (Math.floor(row/2) * kgevens) % 16
                // text = (numCycles * 2 * (1 - row % 2));
                // text = (numCycles * numCols * (row % 2));
                // text = cycleOffset

                // if (times === 0)
                // {
                //     console.log({
                //         row: row,
                //         col: col,
                //         thread: thread,
                //         start: start,
                //         numCycles: numCycles,
                //         cycleOffset: cycleOffset,
                //     })
                // }

                let color = 'rgb(0,0,0,0)';
                if (app.getPaletteColor(thread))
                    color = app.getPaletteColor(thread);
                p5.fill(color)
                
                p5.beginShape()

                switch (patternStyle)
                {
                case 'square':
                case 'rhombus':
                default:
                    p5.vertex(centerX - unitWidth, centerY)
                    p5.vertex(centerX, centerY - unitHeight)
                    p5.vertex(centerX + unitWidth, centerY)
                    p5.vertex(centerX, centerY + unitHeight)
                    break;
                case 'hex':
                    for (const p of hexPoints)
                    {
                        p5.vertex(centerX + p.x, centerY + p.y);
                    }
                    break;
                }
                
                p5.endShape(p5.CLOSE)

                let textColor = contrastingColor(p5,color);
                p5.fill(textColor)
                
                // p5.text(`${row}`, centerX, centerY);
                if (app.showThreadNums)
                    p5.text(text, centerX, centerY);
            }
        }
        times++

    };

    p5.windowResized = () =>
    {
        const area = document.getElementsByClassName('pattern-preview')[0];
        p5.resizeCanvas(area.clientWidth, area.clientHeight)
    }
};

const ColorSketch = (p5) => {

    circleAreaHeightScalar = 1/2;

    p5.setup = () => {
        const area = document.getElementsByClassName('color-details')[0];
        const canvas = p5.createCanvas(area.clientWidth, area.clientHeight);
        canvas.parent(area);
        canvas.elt.id='pattern-canvas'

        app.setSketch(p5);
    };

    p5.windowResized = () => {
        app.resized(p5);
    }

    p5.draw = () => {
        p5.textAlign(p5.CENTER)
        p5.background(240);
        p5.stroke(0);

        p5.stroke(0)
        p5.fill(0,0,0,0)

        const cx = app.cx;
        const cy = app.cy;

        p5.circle(cx, cy, app.radius * 2)

        for (let t = 0; t < app.numThreads(); t++)
        {
            p5.stroke(0,0,0,0)

            let color = app.getPaletteColor(t);
            if (color)
                p5.fill(color)
            else
            {
                p5.stroke(0)
                p5.fill(0,0,0,0);
            }
            
            const l = app.layout[t];
            
            p5.circle(l.x, l.y, 25);

            p5.fill(0)
            p5.text(t+1, l.xLabel, l.yLabel + 8)
        }
    };

    p5.mouseClicked = () =>
    {
        const swatch = app.getSwatchAt(p5.mouseX, p5.mouseY);
        if (swatch < 0)
            return;

        app.setThreadColor(swatch, app.currentColor);
    }

    p5.windowResized = () =>
    {
        const area = document.getElementsByClassName('color-details')[0];
        p5.resizeCanvas(area.clientWidth, area.clientHeight);
    }
};

// APP INIT

const app = new BraidDesigner();
app.setTechnique(PATTERNS.KongoGumi);

// Initialize all three canvases
let patternSketch = new p5(PatternSketch);
// new p5(DetailsSketch);
let colorSketch = new p5(ColorSketch);

// Populate pattern options
const patternSelector = document.getElementById('pattern-select');
for (const key in PATTERNS)
{
    const option = document.createElement("option");
    option.value = PATTERNS[key];
    option.innerText = PATTERNS[key];
    patternSelector.appendChild(option)
}

// Setup callbacks
patternSelector.oninput = () =>
{
    app.setTechnique(patternSelector.value);
}

const numThreadsInput = document.getElementById('num-threads-input');
numThreadsInput.oninput = () =>
{
    const threads = parseInt(numThreadsInput.value)
    app.setNumThreads(threads)
}

