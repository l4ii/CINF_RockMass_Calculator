import fs from 'node:fs'

const path = 'frontend/src/components/modules/CopperWorkflow.tsx'
let s = fs.readFileSync(path, 'utf8')
const start = "        {batchTableView === 'element' ? ("
const end = '        ) : ('
const i0 = s.indexOf(start)
const i1 = s.indexOf(end, i0)
if (i0 < 0 || i1 < 0) {
  console.error('markers not found', i0, i1)
  process.exit(1)
}
const replacement = `${start}
        <div
          key="element-batch-view"
          className={\`rounded-lg transition-all duration-300 batch-table-view-enter \${
            batchTableHighlight
              ? darkMode
                ? 'ring-2 ring-blue-500/60 ring-offset-2 ring-offset-gray-900'
                : 'ring-2 ring-blue-400/70 ring-offset-2 ring-offset-white'
              : ''
          }\`}
        >
          <CopperBatchElementTable
            darkMode={darkMode}
            tableWidth={calculationTableWidth}
            elementKeys={rawMaterialElementKeys}
            feedTotalWeight={furnaceFeed.totalWeight}
            rawMaterials={rawMaterials}
            solventColumns={solventColumns}
            fuelColumn={fuelColumn}
            oxygenAirColumn={oxygenAirColumn}
            furnaceFeedRatios={furnaceFeed.ratios}
            furnaceBlendMoisture={furnaceBlendMoisture}
            productTableColumns={productTableColumns.map((product) => ({
              key: product.key,
              name: product.name === '总计' ? '总计' : getStageProductName(activeProcessStageId, product),
              mass: product.mass,
              composition: product.composition,
            }))}
            productTotalMass={tableProductResult.totalProductMass}
            productCalculated={productCalculated}
            materialLibrary={materialLibrary}
            formatTableNumber={formatTableNumber}
            solveInputClass={solveInputClass}
            moistureInputClass={moistureInputClass}
            materialSelectClass={materialSelectClass}
            productOutputCellClass={productOutputCellClass}
            ratioInputValue={ratioInputValue}
            moistureInputValue={moistureInputValue}
            rawWeightDrafts={rawWeightDrafts}
            ratioDrafts={ratioDrafts}
            phaseCellStatus={phaseCellStatus}
            sulfurInputStatus={sulfurInputStatus}
            rawWeightStatus={rawWeightStatus}
            solventWeightStatus={solventWeightStatus}
            fuelWeightStatus={fuelWeightStatus}
            oxygenAirInputStatus={oxygenAirInputStatus}
            moistureStatus={moistureStatus}
            phaseUnknownElements={PHASE_UNKNOWN_ELEMENTS}
            phaseCompleted={phaseCompleted}
            onRawWeightChange={updateRawWeight}
            onApplyLibraryMaterial={applyLibraryMaterial}
            onRemoveMaterial={removeMaterial}
            onRawRatioChange={updateRawRatio}
            onRawRatioBlur={(id, element, value) => commitRatioDraft('raw', id, element, value)}
            onSolventWeightChange={updateSolventWeight}
            onSolventWeightBlur={commitSolventWeightDraft}
            onFuelWeightChange={updateFuelWeight}
            onFuelWeightBlur={commitFuelWeightDraft}
            onSolventRatioChange={(id, element, value) => updateRatioDraft('solvent', id, element, value)}
            onSolventRatioBlur={(id, element, value) => commitRatioDraft('solvent', id, element, value)}
            onFuelRatioChange={(element, value) => updateRatioDraft('fuel', fuelColumn.id, element, value)}
            onFuelRatioBlur={(element, value) => commitRatioDraft('fuel', fuelColumn.id, element, value)}
            onGasRatioChange={(element, value) => updateRatioDraft('gas', oxygenAirColumn.id, element, value)}
            onGasRatioBlur={(element, value) => commitRatioDraft('gas', oxygenAirColumn.id, element, value)}
            onMaterialMoistureChange={updateMaterialMoisture}
            onMaterialMoistureBlur={commitMoistureDraft}
            onFuelMoistureChange={updateFuelMoisture}
            onFuelMoistureBlur={() => commitMoistureDraft('fuel', fuelColumn.id)}
            onOpenElementAssist={openElementAssist}
            onOpenIterationAssist={openIterationAssist}
          />
        </div>
`
s = s.slice(0, i0) + replacement + s.slice(i1)
fs.writeFileSync(path, s)
console.log('ok', i1 - i0)
