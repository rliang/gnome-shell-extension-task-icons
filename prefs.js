const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

let _settings;

function init() {
  let schema = Me.metadata['settings-schema'];
  let source = Gio.SettingsSchemaSource.new_from_directory(Me.dir.get_path(),
    Gio.SettingsSchemaSource.get_default(), false)
  _settings = new Gio.Settings({
    settings_schema: source.lookup(schema, true),
  });
}

function buildPrefsWidget() {
  let widget = new Gtk.Grid({
    orientation: Gtk.Orientation.HORIZONTAL,
  });
  widget.add(new Gtk.Label({
    label: 'Icons on right',
    halign: Gtk.Align.START,
    hexpand: true,
  }));
  let right = new Gtk.Switch();
  _settings.bind('icons-on-right', right, 'state', Gio.SettingsBindFlags.DEFAULT);
  widget.add(right);
  widget.show_all();
  return widget;
}
