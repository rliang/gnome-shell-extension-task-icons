const Gio            = imports.gi.Gio;
const St             = imports.gi.St;
const Shell          = imports.gi.Shell;
const Main           = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;

let _configs;
let _buttons = [];

function filter_unique_apps() {
  const ids = {};
  return app => {
    if (_configs.get_boolean('icons-per-application') && ids[app.id])
      return false;
    ids[app.id] = true;
    return true;
  };
}

function create_indicator_icons(button, windows) {
  const max = _configs.get_value('icons-maximum-amount').deep_unpack();
  const cls = _configs.get_value('icons-style-class').deep_unpack();
  global.display.sort_windows_by_stacking(windows)
    .reverse()
    .map(win => Shell.WindowTracker.get_default().get_window_app(win))
    .filter(filter_unique_apps())
    .slice(0, max !== null ? max : undefined)
    .map(app => app.create_icon_texture(16))
    .map(tex => new St.Bin({style_class: cls, child: tex}))
    .forEach(ico => button.get_child().add_child(ico));
}

function create_indicator_label(button, text) {
  const pos = _configs.get_value('workspace-numbers-position').deep_unpack();
  if (pos === null)
    return;
  const label = new St.Label({text : text.toString()});
  button.get_child().insert_child_at_index(label, pos);
}

function create_indicator_style(button, active) {
  if (!active)
    return;
  button.pseudo_class = (button.pseudo_class || '') +
      ' ' + _configs.get_string('active-workspace-style-pseudo-class');
}

function create_indicator_button(index) {
  const active = global.screen.get_active_workspace_index();
  const poskey = index === active
                     ? 'active-workspace-position'
                     : index < active ? 'workspaces-before-active-position'
                                      : 'workspaces-after-active-position';
  const pos = _configs.get_value(poskey).deep_unpack();
  if (pos === null)
    return;
  const workspc = global.screen.get_workspace_by_index(index);
  const windows = workspc.list_windows();
  if (!windows.length)
    return;
  const button = new St.Bin({
    style_class: 'panel-button',
    reactive:    true,
    can_focus:   true,
    track_hover: true,
    child:       new St.BoxLayout({style_class : 'panel-status-menu-box'})
  });
  _buttons.push(button);
  button.connect('button-press-event',
                 () => workspc.activate(global.get_current_time()));
  create_indicator_icons(button, windows);
  create_indicator_label(button, index + 1);
  create_indicator_style(button, index === active);
  const box = _configs.get_string('panel-box');
  Main.panel[box].insert_child_at_index(button, pos + index);
}

function refresh() {
  _buttons.splice(0).forEach(b => b.destroy());
  for (let i = 0; i < global.screen.get_n_workspaces(); i++)
    create_indicator_button(i);
}

let _handle_sc;
let _handle_wm;
let _handle_gs;

function enable() {
  _handle_sc = global.screen.connect('restacked', refresh);
  _handle_wm = global.window_manager.connect('switch-workspace', refresh);
  _handle_gs = _configs.connect('changed', refresh);
}

function disable() {
  global.screen.disconnect(_handle_sc);
  global.window_manager.disconnect(_handle_wm);
  _configs.disconnect(_handle_gs);
}

function init() {
  const me = ExtensionUtils.getCurrentExtension();
  const ss = Gio.SettingsSchemaSource.new_from_directory(
      me.dir.get_path(), Gio.SettingsSchemaSource.get_default(), false);
  _configs = new Gio.Settings({
    settings_schema: ss.lookup(me.metadata['settings-schema'], true)
  });
}
