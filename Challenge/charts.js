function init() {
  // Grab a reference to the dropdown select element
  let selector = d3.select("#selDataset");

  // Use the list of sample names to populate the select options
  d3.json("samples.json").then((data) => {
    let sampleNames = data.names;

    sampleNames.forEach((sample) => {
      selector
        .append("option")
        .text(sample)
        .property("value", sample);
    });

    // Use the first sample from the list to build the initial plots
    let firstSample = sampleNames[0];
    buildCharts(firstSample);
    buildMetadata(firstSample);
  });
}

// Initialize the dashboard
init();

function optionChanged(newSample) {
  // Fetch new data each time a new sample is selected
  buildMetadata(newSample);
  buildCharts(newSample);
  
}

// Demographics Panel 
function buildMetadata(sample) {
  d3.json("samples.json").then((data) => {
    let metadata = data.metadata;
    // Filter the data for the object with the desired sample number
    let resultArray = metadata.filter(sampleObj => sampleObj.id == sample);
    let result = resultArray[0];
    // Use d3 to select the panel with id of `#sample-metadata`
    let PANEL = d3.select("#sample-metadata");

    // Use `.html("") to clear any existing metadata
    PANEL.html("");

    // Use `Object.entries` to add each key and value pair to the panel
    // Hint: Inside the loop, you will need to use d3 to append new
    // tags for each key-value in the metadata.
    Object.entries(result).forEach(([key, value]) => {
      PANEL.append("h6").text(`${key.toUpperCase()}: ${value}`);
    });

  });
}

// 1. Create the buildCharts function.
function buildCharts(sample) {
  // 2. Use d3.json to load and retrieve the samples.json file 
  d3.json("samples.json").then((data) => {
    // 3. Create a variable that holds the samples array. 
    let samplesArray = data.samples;
    allSamples=[]
      for (let x = 0; x<samplesArray.length;x++) {
        allSamples.push({
          otu_ids: samplesArray[x].otu_ids,
          otu_labels: samplesArray[x].otu_labels,
          sample_values: samplesArray[x].sample_values
        })
      };
   // 4. Create a variable that filters the samples for the object with the desired sample number.
   let samplePick = samplesArray.filter(sampleObj => sampleObj.id == sample)
   //  5. Create a variable that holds the first sample in the array.
   let firstSample = samplePick[0]
   // 6. Create variables that hold the otu_ids, otu_labels, and sample_values.
   let  otu_ids = firstSample.otu_ids
   let  otu_labels = firstSample.otu_labels
   let  sample_values = firstSample.sample_values
     // 8. Create the trace for the bar chart. 
     topTen=[]
     for (let x = 0; x<firstSample.sample_values.length;x++) {
       topTen.push({
         otu_ids: 'OTU ' + firstSample.otu_ids[x].toString(),
         otu_labels: firstSample.otu_labels[x],
         sample_values: firstSample.sample_values[x]
       })
     };
     topTen = topTen.sort((a,b)=>b.sample_values-a.sample_values).slice(0,10)
       //get topTen for bars
     let bar_otu_ids = []
     let bar_otu_labels = []
     let bar_sample_values = []
     for (samp of topTen){
       bar_otu_ids.push(samp.otu_ids)
       bar_otu_labels.push(samp.otu_labels)
       bar_sample_values.push(samp.sample_values)
     }
     // averages per occurrence of each OTU ID
    let otuTotal = {}
    let otuCount = {}
    for (let x=0;x<allSamples.length;x++) {
      for (let y=0;y<allSamples[x].otu_ids.length;y++){
        if (allSamples[x].otu_ids[y] in otuTotal){
          otuTotal[allSamples[x].otu_ids[y]]+=allSamples[x].sample_values[y]
          otuCount[allSamples[x].otu_ids[y]]+=1
        }
        else {
          otuTotal[allSamples[x].otu_ids[y]]=allSamples[x].sample_values[y]
          otuCount[allSamples[x].otu_ids[y]]=1
        }}
    }
    let otuAvg = {}
    for (let x=0;x<Object.values(otuTotal).length;x++){
      otuAvg['OTU '+Object.keys(otuTotal)[x]] = Object.values(otuTotal)[x]/Object.values(otuCount)[x]
    }
      //save avg values for OTU ID (bar chart)
    let barAvg=[]
    for (x of bar_otu_ids) {
      barAvg.push(otuAvg[x])
    }
      //trace bar
    let barData = {
      name:"ID: "+sample.toString(),
      x: bar_sample_values,
      y: bar_otu_ids,
      text: bar_otu_labels,
      type: "bar", 
      orientation: 'h'
    };
    let barDataAvg = {
      name: "Avg",
      x: barAvg,
      y: bar_otu_ids,
      mode: "markers",
      marker: {color:"pink",size:5}
    }
    barData = [barData,barDataAvg];
 // 9. Create the layout for the bar chart. 
 let barLayout = {
  title: "Top 10 Bacteria Cultures Found",
  yaxis: {autorange: "reversed"},
  autosize: true,
  showlegend:false,
  hovermode: "closest"
};

// 10. Use Plotly to plot the data with the layout. 
Plotly.newPlot("bar", barData, barLayout)

// D2-Create a Bubble Chart
    // 1. Create the trace for the bubble chart.
    var bubbleData = [{
      x: otu_ids,
      y: sample_values,
      text: otu_labels,
      mode: "markers",
      marker: {size: sample_values.map(x=>.9*x),color: otu_ids}
    }];

    // 2. Create the layout for the bubble chart.
    let bubbleLayout = {
      title: "Bacteria Cultures Per Sample",
      xaxis: {title:"OTU ID"},
      yaxis: {title:"Sample Value"},
      autosize: true,
      hovermode: "closest",
    };

    // 3. Use Plotly to plot the data with the layout.
    Plotly.newPlot("bubble", bubbleData, bubbleLayout); 

    
    // D3-Create a Gauge Chart
    // 1. Create a variable that filters the metadata array for the object with the desired sample number.
    var metadata = data.metadata;
    var avg_wfreq = 0

    // Compute reference value for gauge chart delta
    for (x of metadata) {
      avg_wfreq+=x.wfreq}
    avg_wfreq = avg_wfreq/metadata.length
    avg_wfreq = avg_wfreq.toFixed(2)

    // Filter the data for the object with the desired sample number
    let metadataArray = metadata.filter(sampleObj => sampleObj.id == sample);

    // 2. Create a variable that holds the first sample in the metadata array.
    let metadataPick = metadataArray[0];

    // 3. Create a variable that holds the washing frequency.
    let wfreq = metadataPick.wfreq.toFixed(2)

    // 4. Create the trace for the gauge chart.
    let gaugeData = [{
        domain: { x: [0, 1], y: [0, 1] },
        value: wfreq,
        title: { text: "<span style='font-weight:bold'>Belly Button Washing Frequency</span><br><span style='font-size:0.8em'>Scrubs per Week</span>" },
        type: "indicator",
        mode: "gauge+number+delta",
        delta: { reference: avg_wfreq },
        gauge: {
          bar: {color: "black"},
          axis: { range: [null, 10],tickmode:'array',tickvals: [0,2,4,6,8,10] },
          steps: [
            { range: [0, 2], color: "red" },
            { range: [2, 4], color: "orange" },
            { range: [4, 6], color: "yellow" },
            { range: [6, 8], color: "yellowgreen" },
            { range: [8, 10], color: "green" }
          ]
        }
    }];

    // 6. Use Plotly to plot the gauge data and layout.
    Plotly.newPlot("gauge",gaugeData);
});
}
