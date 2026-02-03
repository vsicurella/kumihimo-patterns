
class BraidControls
{
    // business
    sketch;

    DIV;
    // CANVAS;
    PADDING;

    picker;
    
    // data
    braid;

    labelScalar = 1.2;
    radiusScalar = 0.25;

    radius;
    cx;
    cy;

    spots;  // Actual number of circle divisions (braid.size * 1.5)
    layout;

    // params
    showThreadNums=true;

    // recentColors = []
    currentColor = ''

    // graphics stuff (may move to a viewer class)
    patternWidth = 0
    patternHeight = 0

    constructor(braid)
    {
        this.braid = braid;
        this.layout = [];

        this.DIV = document.getElementsByClassName('color-details')[0]   
    }

    constructCircle(p5)
    {
        // this.radius = p5.height * this.radiusScalar;
        this.radius = 175;
        this.cx = this.radius * this.labelScalar + 20
        this.cy = this.radius * this.labelScalar + 20;

        this.patternWidth = this.radius * 2 + this.radius * this.labelScalar * 2
        this.patternHeight = p5.height;
    }

    setSketch(p5)
    {
        this.sketch = p5;

        this.currentColor = this.braid.color(0);

        let numThreads = this.sketch.getItem('kumihimo-num-threads')
        if (numThreads == null)
            numThreads = 16;
        app.setNumThreads(numThreads);
        updateThreadsInput(numThreads)

        this.reset(this.sketch);
    }

    reset(p5)
    {
        this.layout = [];

        this.picker.palette = this.getPaletteList()
        this.picker.color = this.braid.color(0)

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
        this.constructCircle(p5)

        for (let t = 0; t < this.braid.size; t++)
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
        for (var t = 0; t < this.braid.size; t++)
            this.sketch.storeItem(braidColorKey(t), this.braid.color(t));
    }

    setPalette(newPalette)
    {
        this.braid.setPalette(newPalette);

        if (this.sketch)
            this.savePalette(this.sketch);

        this.picker.palette = this.getPaletteList()
    }

    setColor(index, color)
    {
        this.braid.set(index, color);
        this.sketch.storeItem(braidColorKey(index), color);
        this.picker.palette = this.getPaletteList();
    }

    rotatePalette(steps)
    {
        const start = ((steps % this.braid.size) + this.braid.size) % this.braid.size;
        const newPalette = [...this.braid.palette.slice(start, this.braid.size), ...this.braid.palette.slice(0, start)];
        this.setPalette(newPalette);
    }

    getPaletteList()
    {
        const allColors = [...this.braid.palette ]
        const uniqueColors = allColors.filter((color, index, array) => array.indexOf(color) === index);
        return uniqueColors;
    }

    getSwatchAt(x, y)
    {
        const p5 = this.sketch;
        const step = (2*p5.PI / this.spots);
        const th = (p5.atan2(y-this.cy, x-this.cx) + p5.PI * 2) % (2*p5.PI);
        const rad = p5.dist(x, y, this.cx, this.cy)
        for (var t = 0; t < this.braid.size; t++)
        {
            const theta = this.layout[t].theta;
            if (p5.abs(th - theta) < step * 0.33 && p5.abs(rad - this.radius) < 15)
            {
                return t;
            }
        }

        return -1;
    }
}

