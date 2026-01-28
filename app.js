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

    DIV;
    CANVAS;
    PADDING;

    braid;

    colorDisk;

    picker;

    labelScalar = 1.2;
    radiusScalar = 0.25;

    radius;
    cx;
    cy;

    spots;  // Actual number of circle divisions (braid.size * 1.5)
    layout;
    clicked;

    // recentColors = []
    activeColor = ''

    constructor(braid)
    {
        this.braid = braid;
        this.layout = [];

        // Setup color picker
        this.DIV = document.getElementsByClassName('color-details')[0]
        const colorPicker = document.createElement('DIV');
        colorPicker.classList.add('picker');
        colorPicker.id = 'color-picker'
        colorPicker.setAttribute('acp-color', this.activeColor)
        
        this.picker = AColorPicker.createPicker(colorPicker)
        this.picker.palette = this.getPaletteList();
        this.picker.on('change', (picker, color) => this.activeColor = color)
    }

    constructCircle(p5)
    {
        this.radius = p5.height * this.radiusScalar;
        this.cx = p5.width/2;
        this.cy = p5.height/2
    }

    setSketch(p5)
    {
        this.sketch = p5;
        this.CANVAS = document.getElementById('color-controls-canvas')

        this.DIV.appendChild(this.picker.element)
        this.activeColor = braid.color(0);

        this.reset(this.sketch);
    }

    reset(p5)
    {
        this.layout = [];

        this.picker.palette = this.getPaletteList()
        this.picker.setColor(this.braid.color(0))

        this.constructCircle(p5);

        this.spots = this.braid.size * 1.5;
        const step = 2 * p5.PI / this.spots;
        for (let t = 0; t < this.braid.size; t++)
        {
            const skip = Math.floor(t / 2);
            const theta = (step * (t + skip) + p5.PI * 1.5 - step / 2) % (2 * p5.PI);

            const x = p5.cos(theta) * this.radius + this.cx;
            const y = p5.sin(theta) * this.radius + this.cy;

            this.layout.push({ 
                theta: theta, 
                x: x, 
                y: y,
                xLabel: (x - this.cx) * this.labelScalar + this.cx,
                yLabel: (y - this.cy) * this.labelScalar + this.cy,
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
        }
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

        // for (var t = 0; t < braid.size; t++)
        // {
        //     this.layout[t].picker.elt.value = braid.color(t);
        // }

        this.picker.palette = this.getPaletteList();
    }

    setColor(index, color)
    {
        braid.set(index, color);
        this.sketch.storeItem(braidColorKey(index), color);
        this.picker.palette = this.getPaletteList();
    }

    rotatePalette(steps)
    {
        const start = ((steps % braid.size) + braid.size) % braid.size;
        const newPalette = [...braid.palette.slice(start, braid.size), ...braid.palette.slice(0, start)];
        this.setPalette(newPalette);
    }

    getPaletteList()
    {
        const allColors = [...braid.palette ]//, ...this.recentColors];
        const uniqueColors = allColors.filter((color, index, array) => array.indexOf(color) === index);
        return uniqueColors;
    }

    getSwatchAt(x, y)
    {
        const p5 = this.sketch;
        const step = (2*p5.PI / this.spots);
        const th = (p5.atan2(y-this.cy, x-this.cx) + p5.PI * 2) % (2*p5.PI);
        const rad = p5.dist(x, y, p5.width/2, p5.height/2)
        for (var t = 0; t < braid.size; t++)
        {
            const theta = this.layout[t].theta;
            // console.log(mtheta, theta, step*0.5)
            // console.log(p5.abs(mtheta - theta), p5.abs(mradius - radius))
            if (p5.abs(th - theta) < step * 0.33 && p5.abs(rad - this.radius) < 15)
            {
                return t;
            }
        }

        return -1;
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

    circleAreaHeightScalar = 1/2;

    p5.setup = () => {
        const area = document.getElementsByClassName('color-details')[0];
        area.height = document.body.clientHeight * circleAreaHeightScalar;
        const canvas = p5.createCanvas(area.clientWidth, area.height);
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
            
            const l = braidControls.layout[t];
            
            p5.circle(l.x, l.y, 25);

            p5.fill(0)
            p5.text(t+1, l.xLabel, l.yLabel + 8)
        }
    };

    p5.mouseClicked = () =>
    {
        const swatch = braidControls.getSwatchAt(p5.mouseX, p5.mouseY);
        if (swatch < 0)
            return;

        braidControls.setColor(swatch, braidControls.activeColor);
    }
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