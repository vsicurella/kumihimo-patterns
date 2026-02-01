
function braidColorKey(index)
{
    return `kumihimo-braid-color-${index}`;
}

const PATTERNS =
{
    KongoGumi: "Kongo Gumi",
    NaikiGumi: "Naiki Gumi",
    NaikiGaeshi: "Naiki Gaeshi"
}

const EditType =
{
    SetColor: "Set Thread Color",
    RotateColors: "Rotate Thread Colors",
    SetPalette: "Set Color Palette",
    SetNumThreads: "Set Num Threads",
    SetTechnique: "Set Thread Technique"
}
class Edit
{
    constructor(type, newValue, oldValue)
    {
        this.type = type;
        this.newValue = newValue;
        this.oldValue = oldValue;
    }

    static SetColor(index, newColor, oldColor)
    {
        return new Edit(
            EditType.SetColor, 
            { thread: index, color: newColor }, 
            { thread: index, color: oldColor })
    }

    static RotateColors(value)
    {
        return new Edit(EditType.RotateColors, value, -value);
    }

    static SetPalette(newPalette, oldPalette)
    {
        return new Edit(EditType.SetPalette, newPalette, oldPalette);
    }

    static SetNumThreads(newNum, oldNum)
    {
        return new Edit(EditType.SetNumThreads, newNum, oldNum);
    }

    static SetTechnique(newTechnique, oldTechnique)
    {
        return new Edit(EditType.SetTechnique, newTechnique, oldTechnique);
    }

}
