import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import seed from '../data/seed.json'
import type { Defect, Station, WorkOrder } from '../types'
import { DefectPanel } from './DefectPanel'

const stations = seed.stations as Station[]
const orders = seed.workOrders as WorkOrder[]
const defects = seed.defects as Defect[]

function setup() {
  const onCreate = vi.fn().mockResolvedValue(undefined)
  const onClose = vi.fn().mockResolvedValue(undefined)
  render(<DefectPanel stations={stations} orders={orders} defects={defects} onCreate={onCreate} onClose={onClose} />)
  return { onCreate, onClose }
}

describe('DefectPanel', () => {
  it('shows validation errors and does not submit an empty form', () => {
    const { onCreate } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Report defect' }))

    expect(screen.getByText('Choose the station where the defect was found.')).toBeInTheDocument()
    expect(screen.getByText('Choose the work order.')).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('submits a valid defect with a trimmed description', async () => {
    const { onCreate } = setup()
    fireEvent.change(screen.getByLabelText('Station'), { target: { value: 'st-30' } })
    fireEvent.change(screen.getByLabelText('Work order'), { target: { value: 'wo-2043' } })
    fireEvent.click(screen.getByLabelText('critical'))
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: '  Loose PE connection on panel 7  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Report defect' }))

    await waitFor(() => expect(onCreate).toHaveBeenCalledTimes(1))
    expect(onCreate).toHaveBeenCalledWith({
      stationId: 'st-30',
      workOrderId: 'wo-2043',
      category: 'wiring',
      severity: 'critical',
      description: 'Loose PE connection on panel 7',
    })
    expect(await screen.findByText('Defect reported.')).toBeInTheDocument()
  })

  it('lists only open defects until "Show closed" is ticked', () => {
    setup()
    expect(screen.queryByText(/Burr on bend edge/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByLabelText('Show closed'))
    expect(screen.getByText(/Burr on bend edge/)).toBeInTheDocument()
  })
})
