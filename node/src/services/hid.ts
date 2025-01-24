let device

export function handleConnectedDevice(e) {
  console.log('Device connected: ' + e.device.productName)
}

export function handleDisconnectedDevice(e) {
  console.log('Device disconnected: ' + e.device.productName)
  console.dir(e)
}

function selectDevice() {
  navigator.hid
    .requestDevice({ filters: [{ vendorId: 0x046d }] })
    .then(devices => {
      if (devices.length == 0) return
      device = devices[0]
      if (!device.opened)
        device
          .open() // avoid re-opening an already open device
          .then(() => {
            console.log('Opened device: ' + device.productName)
            device.addEventListener('inputreport', handleInputReport)
          })
          .catch(error => {
            console.error(error)
          })
    })
}

function handleInputReport(e) {
  switch (e.reportId) {
    case 1: // translation event
      const Tx = e.data.getInt16(0, true) // 'true' parameter is for little endian data
      const Ty = e.data.getInt16(2, true)
      const Tz = e.data.getInt16(4, true)
      console.log('Tx: ' + Tx + ', Ty: ' + Ty + ', Tz: ' + Tz)
      break

    case 2: // rotation event
      const Rx = e.data.getInt16(0, true)
      const Ry = e.data.getInt16(2, true)
      const Rz = e.data.getInt16(4, true)
      console.log('Rx: ' + Rx + ', Ry: ' + Ry + ', Rz: ' + Rz)
      break

    case 3: // key press/release event
      const value = e.data.getUint8(0)
      /*
				 For my SpaceNavigator, a device having two (2) keys only:
				 value is a 2-bit bitmask, allowing 4 key-states:
				 value = 0: no keys pressed
				 value = 1: left key pressed
				 value = 2: right key pressed
				 value = 3: both keys pressed
				 */
      console.log(
        'Left key ' +
          (value & 1 ? 'pressed,' : 'released,') +
          '   Right key ' +
          (value & 2 ? 'pressed, ' : 'released;')
      )
      break

    default: // just in case a device exhibits unexpected capabilities  8-)
      console.log(
        e.device.productName +
          ': Received UNEXPECTED input report ' +
          e.reportId
      )
      console.log(new Uint8Array(e.data.buffer))
  }
}

function ledOn() {
  const outputReportId = 4
  const outputReport = Uint8Array.from([1])

  device
    .sendReport(outputReportId, outputReport)
    .then(() => {
      console.log('Sent output report ' + outputReportId + ': ' + outputReport)
    })
    .catch(error => {
      console.error(error)
    })
}

function ledOff() {
  const outputReportId = 4
  const outputReport = Uint8Array.from([0])

  device
    .sendReport(outputReportId, outputReport)
    .then(() => {
      console.log('Sent output report ' + outputReportId + ': ' + outputReport)
    })
    .catch(error => {
      console.error(error)
    })
}
