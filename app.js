function contrastingColor(p5, color)
{
    if (p5.lightness(color) > 50)
        return p5.color(0)
    return p5.color(255)
    
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
        
        for (var i = 0; i < this.size / 2; i++)
        {
            this.palette.push("rgb(255,0,0)")
            this.palette.push("rgb(0,0,255)")
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
}

const PATTERNS =
{
    NaikiGumi: "Naiki Gumi",
    NaikiGaeshi: "Naiki Gaeshi"
}

let braid = new Braid(16);
console.log(braid)

// let pattern = PATTERNS.NaikiGumi;
let pattern = PATTERNS.NaikiGaeshi;

const PatternSketch = (p5) => {

    // let squares = [];

    p5.setup = () => {
        const area = document.getElementsByClassName('pattern-preview')[0];
        const canvas = p5.createCanvas(area.clientWidth, area.clientHeight);
        canvas.parent(area);

        p5.colorMode('rgb')
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

            // const threadSkip = styleParity * 2;

            const origin = { x: p5.abs(p5.width - patternWidth) * 0.5, y: p5.abs(p5.height - patternHeight) * 0.5};

            for (let row = 0; row <= braid.size; row++)
            {
                for (let col = 0; col < braid.size / 2; col++)
                {
                    let thread = -1;
                    if (row % 2 == 0) // evens (shown as odds)
                    {
                        thread = ((braid.size * styleParity) - row * styleParity + 2 * col) % braid.size
                        // thread = ((braid.size*styleParity) - row * styleParity + 2 * col) % braid.size
                        // thread = ((16 - row) * styleParity * 2 + 2 * col) % 16;
                    }
                    else // odds (shown as evens)
                    {
                        thread = ((row - 1) * styleParity + 2 * col + 1) % braid.size
                        // thread = -1;
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
        p5.text(pattern, 10, 20);
        p5.text(`Threads: ${braid.size}`, 10, 50);
    };
};

const ColorSketch = (p5) => {

    let DIV = null;
    let CANVAS = null;
    let PADDING = 0;

    let labelScalar = 1.2;
    let radiusScalar = 0.3;

    let radius;
    let cx;
    let cy;

    let swatchRadius = 15;

    let layout = [];
    let clicked = []

    function positionColorPicker(picker, x, y)
    {
        // const size = window.getComputedStyle(picker.elt, null).getPropertyValue('clientWidth');
        const offset = Math.round(PADDING / 2);
        picker.position(CANVAS.offsetLeft + x - offset, CANVAS.offsetTop + y - offset)
    }

    p5.setup = () => {
        const area = document.getElementsByClassName('color-details')[0];
        DIV = area;

        const canvas = p5.createCanvas(area.clientWidth, area.clientHeight);
        canvas.parent(area);
        
        CANVAS = canvas.elt
        PADDING = parseInt(window.getComputedStyle(DIV, null).getPropertyValue('padding'))
        console.log(CANVAS)

        radius = p5.height * radiusScalar;
        cx = p5.width/2;
        cy = p5.height/2

        layout = [];
        clicked = [];

        for (let t = 0; t < braid.size; t++)
        {
            const theta = (2 * p5.PI / braid.size * t + p5.PI * 1.5) % (2 * p5.PI);
            const x = p5.cos(theta) * radius + cx;
            const y = p5.sin(theta) * radius + cy;

            const picker = p5.createColorPicker(braid.color(t));
            positionColorPicker(picker, x, y)
            picker.elt.classList.add('circle-picker')

            layout.push({ 
                theta: theta, 
                x: x, 
                y: y,
                xLabel: (x - cx) * labelScalar + cx,
                yLabel: (y - cy) * labelScalar + cy,
                picker: picker 
            });
            clicked.push(false)
        }
    };

    p5.windowResized = () => {
        radius = p5.height * radiusScalar;
        cx = p5.width/2;
        cy = p5.height/2

        for (let t = 0; t < braid.size; t++)
        {
            const l = layout[t];

            const x = p5.cos(l.theta) * radius + cx;
            const y = p5.sin(l.theta) * radius + cy;

            l.x = x;
            l.y = y;
            l.xLabel = (x - cx) * labelScalar + cx;
            l.yLabel = (y - cy) * labelScalar + cy;
            positionColorPicker(l.picker, x, y)
        }
    }

    p5.draw = () => {
        p5.textAlign(p5.CENTER)
        p5.background(240);
        p5.stroke(0);

        p5.stroke(0)
        p5.fill(0,0,0,0)
        p5.circle(cx, cy, radius * 2)

        // let bunches = 2;
        // let bunchAmt = 0;
        // switch (pattern)
        // {
        // case PATTERNS.NaikiGumi:
        //     bunchAmt = -0.05;
        //     break;
        // default:
        //     break;
        // }

        for (let t = 0; t < braid.size; t++)
        {
            // update colors first
            braid.set(t, layout[t].picker.value());

            if (clicked[t])
                p5.stroke(0)
            else
                p5.stroke(0,0,0,0)

            if (braid.color(t))
                p5.fill(braid.color(t))
            else
            {
                p5.stroke(0)
                p5.fill(0,0,0,0);
            }
            // p5.circle(x, y, swatchRadius)

            const x = layout[t].xLabel;
            const y = layout[t].yLabel;

            p5.fill(0)
            p5.text(t+1, x, y + 8)
        }
    };

    // p5.mouseClicked = () =>
    // {
    //     const step = (2*p5.PI / braid.size);
    //     const mtheta = (p5.atan2(p5.mouseY-cy, p5.mouseX-cx) + p5.PI * 2) % (2*p5.PI);
    //     const mradius = p5.dist(p5.mouseX, p5.mouseY, p5.width/2, p5.height/2)
    //     for (var t = 0; t < braid.size; t++)
    //     {
    //         const theta = layout[t].theta;
    //         // console.log(mtheta, theta, step*0.5)
    //         // console.log(p5.abs(mtheta - theta), p5.abs(mradius - radius))
    //         if (p5.abs(mtheta - theta) < step * 0.5 && p5.abs(mradius - radius) < swatchRadius/2)
    //         {
    //             // p5.stroke(0)
    //             // p5.fill(0)
    //             // p5.circle(layout.x, layout.y, 10)
    //             clicked[t] = true;

    //             layout[t].picker.elt.click()
                
    //             break;
    //         }
    //     }
    // }

    p5.mouseReleased = () =>
    {
        
        // const step = (2*p5.PI / braid.size);
        // const mtheta = p5.atan2(p5.mouseY-cy, p5.mouseX-cx) + p5.PI - p5.PI / 2;
        // const mradius = p5.dist(p5.mouseX, p5.mouseY, p5.width/2, p5.height/2)
        for (var t = 0; t < braid.size; t++)
        {
            clicked[t] = false
        //     const theta = layout[t].theta;
        //     console.log(mtheta, theta, step*0.5)
        //     // console.log(p5.abs(mtheta - theta), p5.abs(mradius - radius))
        //     if (p5.abs(mtheta - theta) < step * 0.5 && p5.abs(mradius - radius) < 5)
        //     {
        //         // p5.stroke(0)
        //         // p5.fill(0)
        //         // p5.circle(layout.x, layout.y, 10)
        //         clicked[t] = false;
        //         break;
        //     }
        }
    }
};

// Initialize all three canvases
new p5(PatternSketch);
new p5(DetailsSketch);
new p5(ColorSketch);