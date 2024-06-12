const FilterSampleRate = 32000;
const NCoef = 10;

const x = []; // NCoef + 1
const y = []; // NCoef + 1

const filterInit = () =>
{
    let i;
    for (i = 0; i < NCoef + 1; i++) {
        x[i] = 0;
        y[i] = 0;
    }
}

const ACoef = [
    0.87597369502203937000,
    -8.58934855993218880000,
    38.06896626572500300000,
    -100.42499541032139000000,
    174.60952986487661000000,
    -209.08025163268789000000,
    174.60952986487661000000,
    -100.42499541032139000000,
    38.06896626572500300000,
    -8.58934855993218880000,
    0.87597369502203937000,
];

const BCoef = [
    1.00000000000000000000,
    -9.61546760916044900000,
    41.79258141344106300000,
    -108.11983539083370000000,
    184.36778718580732000000,
    -216.52206113656368000000,
    177.35679197203243000000,
    -100.05324893369672000000,
    37.20391012896932600000,
    -8.23425305888840950000,
    0.82379550976605098000
];

const filterStep = (NewSample) => {
    let n;

    //shift the old samples
    for (n = NCoef; n > 0; n--) {
        x[n] = x[n - 1];
        y[n] = y[n - 1];
    }
    //Calculate the new output
    x[0] = NewSample;
    y[0] = ACoef[0] * x[0];
    for (n = 1; n <= NCoef; n++)
        y[0] += ACoef[n] * x[n] - BCoef[n] * y[n];
    return y[0];
}

const filter = (samples) => {
    const result = [];
    filterInit();
    samples.forEach(sample => {
        result.push(filterStep(sample));
    });
    return result;
}

module.exports = {
    "filter": filter
}
