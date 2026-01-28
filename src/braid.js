
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
