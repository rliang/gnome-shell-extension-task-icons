const Meta = imports.gi.Meta;
const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const St = imports.gi.St;
const Shell = imports.gi.Shell;
const Main = imports.ui.main;
const Mainloop = imports.mainloop;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

let _settings, _iconsBox;

function extProperty(object, key, def) {
  key = '__' + Me.uuid + '_' + key;
  if (!object[key])
    object[key] = def();
  return object[key];
}

function extConnect(object, signal, cb) {
  extProperty(object, 'handles', () => []).push(object.connect(signal, cb));
}

function extDisconnect(object) {
  extProperty(object, 'handles', () => []).forEach(h => object.disconnect(h));
}

function getWorkspaces() {
  let wsList = [];
  for (let i = 0; i < global.screen.n_workspaces; i++)
    wsList.push(global.screen.get_workspace_by_index(i));
  return wsList;
}

function windowIcon(win) {
  return extProperty(win, 'icon', () => new St.Bin({
    style_class: 'taskicons-icon',
    child: Shell.WindowTracker.get_default().get_window_app(win)
      .create_icon_texture(16),
  }));
}

function workspaceBox(ws) {
  let box = extProperty(ws, 'box', () => {
    let box = new St.BoxLayout({
      style_class: 'panel-button',
      reactive: true,
      can_focus: true,
      track_hover: true,
    });
    box.connect('button-press-event', () =>
      ws.activate(global.get_current_time()));
    return box;
  });
  return box;
}

function workspaceLabel(ws) {
  let label = extProperty(ws, 'label', () => new St.Label({
    style_class: 'taskicons-label',
    y_align: Clutter.ActorAlign.CENTER,
  }));
  return label;
}

function checkBuild() {
  let wins = global.get_window_actors()
    .map(a => a.meta_window)
    .filter(w => w.window_type === Meta.WindowType.NORMAL);
  if (wins.length < 1)
    return false;
  if (wins.length === 1 && wins[0].get_workspace() == global.screen.get_active_workspace())
    return false;
  return true;
}

function rebuild() {
  _iconsBox.remove_all_children();
  if (!checkBuild())
    return;
  getWorkspaces()
    .map(ws => [
      ws,
      ws.list_windows().map(windowIcon).filter(icon => icon !== null)
    ])
    .filter(([ws, icons]) => icons.length > 0)
    .forEach(([ws, icons], _, all) => {
      let isActive = ws.index() === global.screen.get_active_workspace_index();
      let isSingle = all.length === 1;
      let box = workspaceBox(ws);
      box.remove_all_children();
      box.pseudo_class = null;
      if (!isSingle || !isActive) {
        let label = workspaceLabel(ws);
        label.set_text((ws.index() + 1).toString());
        label.reparent(box);
      }
      if (!isSingle && isActive) {
        box.pseudo_class = 'active';
      }
      icons.forEach(icon => icon.reparent(box));
      box.reparent(_iconsBox);
    });
}

function init() {
  let schema = Me.metadata['settings-schema'];
  let source = Gio.SettingsSchemaSource.new_from_directory(Me.dir.get_path(),
    Gio.SettingsSchemaSource.get_default(), false)
  _settings = new Gio.Settings({
    settings_schema: source.lookup(schema, true),
  });
}

function enable() {
  _iconsBox = new St.BoxLayout({ style_class: 'taskicons-box' });
  if (_settings.get_boolean('icons-on-right')) {
    Main.panel._rightBox.insert_child_at_index(_iconsBox, 0);
  } else {
    let appMenu = Main.panel.statusArea.appMenu.actor.get_parent();
    let appMenuBox = appMenu.get_parent();
    let appMenuIndex = appMenuBox.get_children().indexOf(appMenu);
    appMenuBox.insert_child_at_index(_iconsBox, appMenuIndex + 1);
  }
  rebuild();
  extConnect(global.screen, 'restacked', rebuild);
  extConnect(global.window_manager, 'switch-workspace', rebuild);
  extConnect(_settings, 'changed', reenable);
}

function disable() {
  extDisconnect(global.screen);
  extDisconnect(global.window_manager);
  extDisconnect(_settings);
  _iconsBox.remove_all_children();
  _iconsBox.destroy();
}

function reenable() {
  disable();
  enable();
}
