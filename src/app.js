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

class BraidDesigner extends BraidControls
{
    currentPattern = PATTERNS.NaikiGumi;

    constructor()
    {
        super(new Braid(16))

        const colorPicker = document.getElementById("color-picker");
        this.picker = AColorPicker.createPicker(colorPicker);

        this.picker.on('change', (picker, color) => this.currentColor = color)
    }

    numThreads()
    {
        return this.braid.size;
    }

    getPaletteColor(index)
    {
        return this.braid.color(index);
    }

    rotateColorsClockwise()
    {
        this.rotatePalette(-1);
    }

    rotateColorsCounterClockwise()
    {
        this.rotatePalette(1);
    }

    paintAllThreads()
    {
        const newPalette = this.braid.palette.map(() => this.currentColor);
        this.setPalette(newPalette)
    }

    toggleThreadNums()
    {
        this.showThreadNums = !this.showThreadNums;
    }
}

const PatternSketch = (p5) => {

    hexPoints = null;

    style = null;
    styleParity = 1;
    unitSize = 15;
    patternStyle = 'hex';

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

        p5.colorMode('rgb')

        resetPattern();
    };

    p5.draw = () => {
        p5.background('#f0f0f0')

        p5.textAlign(p5.CENTER)

        switch (app.currentPattern)
        {
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
            unitHeight = unitSize * 8 / 5;
            break;
        case 'hex':
            unitHeight = unitSize * 9 / 8;
            hexPoints = getHexPoints(unitWidth, unitHeight, Math.PI/6);
            tx = Math.sqrt(3)/2;
            ty = 1.5;
            break;
        }
        
        switch (style)
        {
        case 'plain-weave':

            // basic cross stitch pattern, squares rotated by 45 degrees

            let patternWidth = unitWidth * (app.numThreads() + 0.5);
            let patternHeight = unitHeight * (app.numThreads() * 2);

            if (patternStyle == 'hex')
            {
                patternWidth = unitWidth * Math.sqrt(3)/2 * (app.numThreads() + 0.5)
            }

            const origin = { x: p5.abs(p5.width - patternWidth) * 0.5, y: 20 };

            for (let row = 0; row <= app.numThreads(); row++)
            {
                for (let col = 0; col < app.numThreads() / 2; col++)
                {
                    let thread = -1;
                    if (row % 2 == 0) // evens (shown as odds)
                    {
                        thread = ((app.numThreads() * styleParity) - row * styleParity + 2 * col) % app.numThreads()
                    }
                    else // odds (shown as evens)
                    {
                        thread = ((row - 1) * styleParity + 2 * col + 1) % app.numThreads()
                    }

                    const centerX = origin.x + tx * unitWidth * (col * 2 + 1 + p5.pow(0, row % 2));
                    const centerY = origin.y + ty * unitHeight * (row + 1);

                    // square version
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
                        p5.text(`${thread+1}`, centerX, centerY);

                }
            }


            break;

        default:
            p5.text("Pattern not implemented", p5.width/2,p5.height/2)
            break;
        }
    };
};

const ColorSketch = (p5) => {

    circleAreaHeightScalar = 1/2;

    p5.setup = () => {
        const area = document.getElementsByClassName('color-details')[0];
        const canvas = p5.createCanvas(area.clientWidth, area.clientHeight);
        canvas.parent(area);
        canvas.elt.id='color-controls-canvas'

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

        app.setColor(swatch, app.currentColor);
    }
};

// APP INIT

const app = new BraidDesigner();

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
    app.currentPattern = patternSelector.value;
}

const numThreadsInput = document.getElementById('num-threads-input');
numThreadsInput.onchange = () =>
{
    const threads = parseInt(numThreadsInput.value)
    // console.log('Set to ', threads);
    app.braid = new Braid(threads);

    patternSketch.remove();
    patternSketch = new p5(PatternSketch);

    colorSketch.remove();
    colorSketch = new p5(ColorSketch)
}
