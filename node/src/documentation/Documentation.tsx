import './style.css'
import importGithub from './assets/import-github.mp4'
import reloadMedia from './assets/reload-media.mp4'
import exportPresets from './assets/export-presets.mp4'
import importPresets from './assets/import-presets.mp4'
import presetSlots from './assets/preset-slots.mp4'
import initialize from './assets/initialize.mp4'
import Section from './components/Section'

export default function Documentation() {
  return (
    <>
      <div className='p-4 documentation h-screen w-screen overflow-y-auto overflow-x-hidden'>
        <h1>VorTEX Documentation</h1>
        <p className=''>
          VorTEX is based on a different methods of modifying a mesh.{' '}
        </p>
        <Section title={'Initialize project'} videoSrc={initialize}>
          <li>A full walkthrough on downloading and starting the patch</li>
        </Section>
        <Section title={'Import new changes'} videoSrc={importGithub}>
          <li>Open GitHub Desktop</li>
          <li>Add the VorTEX folder</li>
          <li>Click "Fetch origin"</li>
        </Section>
        <Section title={'Load media folder'} videoSrc={reloadMedia}>
          <li>Drag media folder onto file drop</li>
          <li>Click "reload media" whenever new files are added</li>
          <li>
            Videos and images are accessible in "file 1" and "file 2" dropdowns
          </li>
          <li>
            Use "file 1" to access selected file 1 video, use "file 2" to access
            selected file 2 video.
          </li>
        </Section>
        <Section title={'Export presets'} videoSrc={exportPresets}>
          <li>Click "Export Presets" button</li>
          <li>
            Select folder: a dedicated export folder outside of the main project
            directory
          </li>
          <li>Click save</li>
        </Section>
        <Section title={'Import presets'} videoSrc={importPresets}>
          <li>Drag any previous exported preset file onto the dropdown</li>
        </Section>
        <Section title={'Manage & copy preset slots'} videoSrc={presetSlots}>
          <li>
            Light grey slot: has preset saved; click to select and load the
            preset
          </li>
          <li>Dark grey slot: has no preset saved; click to select.</li>
          <li>Presets are autosaved once you select a new slot</li>
          <li>
            Click "copy" and select a new slot to overwrite the active controls
            into that slot
          </li>
          <li>Click "copy" again to cancel (button will turn back to grey)</li>
          <li>
            NOTE: this will cause the previous data in that slot to be
            overwritten with the current controls
          </li>
        </Section>
      </div>
    </>
  )
}
