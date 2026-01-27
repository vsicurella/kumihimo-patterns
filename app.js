function contrastingColor(p5, color)
{
    if (p5.lightness(color) > 50)
        return p5.color(0)
    return p5.color(255)
    
}

function braidColorKey(index)
{
    return `kumihimo-braid-color-${index}`;
}

class Braid
{
    size;
    palette;

    constructor(numThreads = 16, colors = null)
    {
        this.size = numThreads

        const colorMap = colors || [];
        this.palette = []
        // for (var i = 0; i < this.size; i++)
        //     this.palette.push(colorMap[i] ? colorMap[i] : "rgb(255,0,0)")
        
        for (var i = 0; i < this.size; i++)
        {
            let color = colorMap[i];
            if (color == null)
                color = (i % 2 == 0) ? "rgb(255,0,0)" : "rgb(0,0,255)";

            this.set(i, color);
        }
    }

    color(index)
    {
        return this.palette[index]
    }

    set(index, col)
    {
        this.palette[index] = col;
    }

    setPalette(colors)
    {
        const colorMap = colors || [];
        this.palette = []

        for (var i = 0; i < this.size; i++)
        {
            const color = colorMap[i];
            if (color != null)
                this.set(i, color);
        }
    }
}

class BraidView
{
    braid;

    constructor(braid)
    {
        this.braid = braid;
    }
}

class BraidControls
{
    sketch;

    CANVAS;
    PADDING;

    braid;

    colorDisk;

    labelScalar = 1.2;
    radiusScalar = 0.16;

    radius;
    cx;
    cy;

    layout;
    clicked;

    constructor(braid)
    {
        this.braid = braid;
        this.layout = [];
    }

    setSketch(p5)
    {
        this.sketch = p5;
        this.CANVAS = document.getElementById('color-controls-canvas')
        console.log(this.CANVAS)

        this.radius = p5.height * this.radiusScalar;
        this.cx = p5.width/2;
        this.cy = p5.height/2

        this.reset(this.sketch);
    }

    reset(p5)
    {
        for (const l of this.layout)
        {
            if (l.picker)
                l.picker.remove();
        }
        this.layout = [];

        // this.PADDING = parseInt(window.getComputedStyle(this.CANVAS.parentElement, null).getPropertyValue('padding'))

        this.radius = p5.height * this.radiusScalar;
        this.cx = p5.width/2;
        this.cy = p5.height/2

        const spots = this.braid.size * 1.5;
        const step = 2 * p5.PI / spots;
        for (let t = 0; t < this.braid.size; t++)
        {
            const skip = Math.floor(t / 2);
            const theta = (step * (t + skip) + p5.PI * 1.5 - step / 2) % (2 * p5.PI);

            const x = p5.cos(theta) * this.radius + this.cx;
            const y = p5.sin(theta) * this.radius + this.cy;

            const picker = p5.createColorPicker(this.braid.color(t));
            this.positionColorPicker(picker, x, y)
            picker.elt.classList.add('circle-picker')
            picker.elt.oninput = (el) => this.setColor(t, el.target.value)

            // console.log(window.getComputedStyle(picker.elt, null))

            this.layout.push({ 
                theta: theta, 
                x: x, 
                y: y,
                xLabel: (x - this.cx) * this.labelScalar + this.cx,
                yLabel: (y - this.cy) * this.labelScalar + this.cy,
                picker: picker 
            });
        }
    }

    resized(p5)
    {
        // this.PADDING = parseInt(window.getComputedStyle(this.CANVAS.parentElement, null).getPropertyValue('padding'))

        this.radius = p5.height * this.radiusScalar;
        this.cx = p5.width/2;
        this.cy = p5.height/2

        for (let t = 0; t < braid.size; t++)
        {
            const l = this.layout[t];

            const x = p5.cos(l.theta) * this.radius + this.cx;
            const y = p5.sin(l.theta) * this.radius + this.cy;

            l.x = x;
            l.y = y;
            l.xLabel = (x - this.cx) * this.labelScalar + this.cx;
            l.yLabel = (y - this.cy) * this.labelScalar + this.cy;
            this.positionColorPicker(l.picker, x, y)
        }
    }

    positionColorPicker(picker, x, y)
    {
        // const size = parseInt(window.getComputedStyle(picker.elt, null).getPropertyValue('width'));
        const size = 30;
        // console.log(size)
        const offset = Math.round(size / 2);
        picker.position(this.CANVAS.offsetLeft + x - offset, this.CANVAS.offsetTop + y - offset)
    }

    savePalette()
    {
        for (var t = 0; t < this.size; t++)
            this.sketch.storeItem(braidColorKey(t), braid.color(t));
    }

    setPalette(newPalette)
    {
        braid.setPalette(newPalette);
        this.savePalette(this.sketch);

        for (var t = 0; t < braid.size; t++)
        {
            this.layout[t].picker.elt.value = braid.color(t);
        }
    }

    setColor(index, color)
    {
        braid.set(index, color);
        this.sketch.storeItem(braidColorKey(index), color);
    }

    rotatePalette(steps)
    {
        const start = ((steps % braid.size) + braid.size) % braid.size;
        const newPalette = [...braid.palette.slice(start, braid.size), ...braid.palette.slice(0, start)];
        this.setPalette(newPalette);
    }
}

const PATTERNS =
{
    NaikiGumi: "Naiki Gumi",
    NaikiGaeshi: "Naiki Gaeshi"
}

let braid = new Braid(16);
console.log(braid)

const braidControls = new BraidControls(braid);

let pattern = PATTERNS.NaikiGumi;

const PatternSketch = (p5) => {

    // let squares = [];

    resetPattern = () => {
        let savedColors = []
        for (let t = 0; t < braid.size; t++)
        {
            savedColors.push(p5.getItem(braidColorKey(t)));
        }

        braid.setPalette(savedColors);
    }

    p5.setup = () => {
        const area = document.getElementsByClassName('pattern-preview')[0];
        const canvas = p5.createCanvas(area.clientWidth, area.clientHeight);
        canvas.parent(area);

        p5.colorMode('rgb')

        resetPattern();
    };

    p5.draw = () => {
        // p5.background(255);
        p5.textAlign(p5.CENTER)

        let style = null;
        let styleParity = 1;

        switch (pattern)
        {
        case PATTERNS.NaikiGumi:
            style = 'plain-weave'
            styleParity = 1;
            break;
        case PATTERNS.NaikiGaeshi:
            style = 'plain-weave'
            styleParity = 2;
            break;
        default:
            p5.text("Unknown pattern: " + pattern, p5.width/2, p5.height/2);
            return;
        }
        
        switch (style)
        {
        case 'plain-weave':

            // basic cross stitch pattern, squares rotated by 45 degrees
            const size = 20;

            const patternWidth = size * (braid.size + 0.5);
            const patternHeight = size * (braid.size * 2);

            const origin = { x: p5.abs(p5.width - patternWidth) * 0.5, y: p5.abs(p5.height - patternHeight) * 0.5};

            for (let row = 0; row <= braid.size; row++)
            {
                for (let col = 0; col < braid.size / 2; col++)
                {
                    let thread = -1;
                    if (row % 2 == 0) // evens (shown as odds)
                    {
                        thread = ((braid.size * styleParity) - row * styleParity + 2 * col) % braid.size
                    }
                    else // odds (shown as evens)
                    {
                        thread = ((row - 1) * styleParity + 2 * col + 1) % braid.size
                    }

                    const centerX = origin.x + size * (col * 2 + 1 + p5.pow(0, row % 2));
                    const centerY = origin.y + size * (row + 1);

                    // square version
                    let color = 'rgb(0,0,0,0)';
                    if (braid.color(thread))
                        color = braid.color(thread);
                    p5.fill(color)
                    
                    p5.beginShape()
                    p5.vertex(centerX - size, centerY)
                    p5.vertex(centerX, centerY - size)
                    p5.vertex(centerX + size, centerY)
                    p5.vertex(centerX, centerY + size)
                    p5.endShape(p5.CLOSE)

                    let textColor = contrastingColor(p5,color);
                    p5.fill(textColor)
                    
                    // p5.text(`${row}`, centerX, centerY);
                    // p5.text(`${thread+1}`, centerX, centerY);

                }
            }


            break;

        default:
            p5.text("Pattern not implemented", p5.width/2,p5.height/2)
            break;
        }
    };
};

const DetailsSketch = (p5) => {
    p5.setup = () => {
        const area = document.getElementsByClassName('pattern-details')[0];
        const canvas = p5.createCanvas(area.clientWidth, area.clientHeight);
        canvas.parent(area);
    };

    p5.draw = () => {
        p5.background(240);
        p5.stroke(0);
        // p5.text(pattern, 10, 20);
        // p5.text(`Threads: ${braid.size}`, 10, 50);
    };
};

const ColorSketch = (p5) => {

    // let swatchRadius = 15;

    p5.setup = () => {
        const area = document.getElementsByClassName('color-details')[0];

        const canvas = p5.createCanvas(area.clientWidth, area.clientHeight);
        canvas.parent(area);
        canvas.elt.id='color-controls-canvas'

        braidControls.setSketch(p5);
    };

    p5.windowResized = () => {
        braidControls.resized(p5);
    }

    p5.draw = () => {
        p5.textAlign(p5.CENTER)
        p5.background(240);
        p5.stroke(0);

        p5.stroke(0)
        p5.fill(0,0,0,0)

        const cx = braidControls.cx;
        const cy = braidControls.cy;

        p5.circle(cx, cy, braidControls.radius * 2)

        for (let t = 0; t < braid.size; t++)
        {
            p5.stroke(0,0,0,0)

            if (braid.color(t))
                p5.fill(braid.color(t))
            else
            {
                p5.stroke(0)
                p5.fill(0,0,0,0);
            }

            const x = braidControls.layout[t].xLabel;
            const y = braidControls.layout[t].yLabel;

            p5.fill(0)
            p5.text(t+1, x, y + 8)
        }
    };
};

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
patternSelector.onchange = () =>
{
    pattern = patternSelector.value;
}

const numThreadsInput = document.getElementById('num-threads-input');
numThreadsInput.onchange = () =>
{
    const threads = parseInt(numThreadsInput.value)
    // console.log('Set to ', threads);
    braid = new Braid(threads);
    braidControls.braid = braid

    patternSketch.remove();
    patternSketch = new p5(PatternSketch);

    colorSketch.remove();
    colorSketch = new p5(ColorSketch)
}

function rotateColorsClockwise()
{
    braidControls.rotatePalette(-1);
}

function rotateColorsCounterClockwise()
{
    braidControls.rotatePalette(1);
}