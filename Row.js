class Row {
    constructor() {
        this.lineFeature = {};
        this.actualFeature = {};
        this.mainStroke = {};
    }

    atDisplay(display) {
        display(lineFeature);
    }
}