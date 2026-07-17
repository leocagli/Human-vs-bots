class_name GameCamera
extends Camera2D

## Main game camera with zoom, pan (drag + WASD), edge scroll, and unit centering.
##
## Implements:
## - Zoom: mouse wheel between 0.3× and 2.0× with smooth interpolation
## - Pan: middle-click / right-click drag + WASD keys
## - Edge scroll: cursor ≤20 px from viewport edge moves the camera
## - Space: cycle through units without orders, centered with smooth tween
## - Camera stays within configurable map boundaries

# ---------------------------------------------------------------------------
# Exports
# ---------------------------------------------------------------------------

## Minimum allowed zoom level (default 0.3×)
@export var zoom_min: float = 0.3
## Maximum allowed zoom level (default 2.0×)
@export var zoom_max: float = 2.0
## Zoom step per scroll event (smaller = smoother)
@export var zoom_step: float = 0.05
## Speed multiplier for WASD / edge-scroll panning (world-units/sec, at zoom=1)
@export var pan_speed: float = 600.0
## Edge-scroll activation distance from viewport border in pixels
@export var edge_scroll_margin: int = 20
## Duration in seconds for smooth centering tweens
@export var center_duration: float = 0.35
## Map origin (top-left corner of the map in world coordinates)
@export var map_origin: Vector2 = Vector2.ZERO
## Map size (total dimensions of the playable map in world coordinates)
@export var map_size: Vector2 = Vector2(4000, 4000)

# ---------------------------------------------------------------------------
# Private state
# ---------------------------------------------------------------------------

var _target_zoom: float = 1.0
var _is_dragging: bool = false
var _drag_start_mouse: Vector2 = Vector2.ZERO
var _drag_start_pos: Vector2 = Vector2.ZERO
var _wasd_input: Vector2 = Vector2.ZERO
var _center_tween: Tween = null
var _unit_cycle_index: int = 0

# ---------------------------------------------------------------------------
# Built-in overrides
# ---------------------------------------------------------------------------

func _ready() -> void:
	enabled = true
	anchor_mode = AnchorMode.ANCHOR_MODE_DRAG_CENTER
	_target_zoom = zoom.x
	# Enforce initial zoom limits
	zoom = Vector2(clampf(zoom.x, zoom_min, zoom_max), clampf(zoom.y, zoom_min, zoom_max))
	position = _limit_position(position)


func _process(delta: float) -> void:
	# --- Smooth zoom interpolation ---
	zoom = zoom.lerp(Vector2(_target_zoom, _target_zoom), delta * 10.0)

	# --- WASD panning ---
	_wasd_input = Vector2(
		Input.get_axis(&"camera_left", &"camera_right"),
		Input.get_axis(&"camera_up", &"camera_down")
	)

	if _wasd_input != Vector2.ZERO:
		var speed = pan_speed * (1.0 / zoom.x) * delta
		global_position += _wasd_input.normalized() * speed

	# --- Edge scroll ---
	var mouse_pos: Vector2 = get_viewport().get_mouse_position()
	var viewport_size: Vector2 = get_viewport().get_visible_rect().size
	var edge_dir: Vector2 = Vector2.ZERO

	if mouse_pos.x <= edge_scroll_margin:
		edge_dir.x = -1.0
	elif mouse_pos.x >= viewport_size.x - edge_scroll_margin:
		edge_dir.x = 1.0

	if mouse_pos.y <= edge_scroll_margin:
		edge_dir.y = -1.0
	elif mouse_pos.y >= viewport_size.y - edge_scroll_margin:
		edge_dir.y = 1.0

	if edge_dir != Vector2.ZERO and not _is_dragging:
		var speed = pan_speed * (1.0 / zoom.x) * delta
		global_position += edge_dir.normalized() * speed

	# --- Clamp to map boundaries ---
	global_position = _limit_position(global_position)


func _input(event: InputEvent) -> void:
	# --- Zoom with mouse wheel ---
	if event is InputEventMouseButton:
		match event.button_index:
			MOUSE_BUTTON_WHEEL_UP:
				_target_zoom = clampf(_target_zoom - zoom_step, zoom_min, zoom_max)
			MOUSE_BUTTON_WHEEL_DOWN:
				_target_zoom = clampf(_target_zoom + zoom_step, zoom_min, zoom_max)

	# --- Pan by drag (middle button or right button) ---
	if event is InputEventMouseButton and \
	   (event.button_index == MOUSE_BUTTON_MIDDLE or event.button_index == MOUSE_BUTTON_RIGHT):
		if event.pressed and not _is_dragging:
			_is_dragging = true
			_drag_start_mouse = event.position
			_drag_start_pos = global_position
		elif not event.pressed:
			_is_dragging = false

	if event is InputEventMouseMotion and _is_dragging:
		var offset = (_drag_start_mouse - event.position) * (1.0 / zoom.x)
		global_position = _drag_start_pos + offset

	# --- Space: cycle unit without orders ---
	if event is InputEventKey and event.keycode == KEY_SPACE and event.pressed and not event.echo:
		_cycle_unit_without_orders()


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------

## Center the camera on a world position with smooth tween animation.
func center_on(target_pos: Vector2) -> void:
	# Kill any existing center tween
	if _center_tween and _center_tween.is_valid():
		_center_tween.kill()

	var clamped_target = _limit_position(target_pos)
	_center_tween = create_tween().set_trans(Tween.TRANS_SINE).set_ease(Tween.EASE_OUT)
	_center_tween.tween_property(self, &"global_position", clamped_target, center_duration)


## Returns an array of unit dictionaries that have no current order/action.
## Override this method if the game stores units in a different structure.
func get_units_without_orders() -> Array:
	var idle: Array = []
	# Access the GameState autoload to find units without orders
	if not GameState.units.is_empty():
		for unit in GameState.units:
			# A unit is "without orders" if it has no "order" key or order is empty
			if not unit.has("order") or unit.order == "" or unit.order == null:
				idle.append(unit)
	return idle


## Center the camera on a specific city by its dictionary entry.
func center_on_city(city: Dictionary) -> void:
	if city.has("hex"):
		var center_pos = _hex_to_world(city.hex) if typeof(city.hex) == TYPE_VECTOR2I else Vector2(city.hex.x, city.hex.y)
		center_on(center_pos)
	elif city.has("position"):
		center_on(city.position)


## Center the camera on a specific unit by its dictionary entry.
func center_on_unit(unit: Dictionary) -> void:
	if unit.has("hex"):
		var center_pos = _hex_to_world(unit.hex) if typeof(unit.hex) == TYPE_VECTOR2I else Vector2(unit.hex.x, unit.hex.y)
		center_on(center_pos)
	elif unit.has("position"):
		center_on(unit.position)


## Set the map bounds for the camera.
func set_map_bounds(origin: Vector2, size: Vector2) -> void:
	map_origin = origin
	map_size = size


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

## Cycle to the next unit that has no pending order, with smooth centering.
func _cycle_unit_without_orders() -> void:
	var idle_units = get_units_without_orders()
	if idle_units.is_empty():
		return

	# Increment the cycle index and wrap around
	_unit_cycle_index = (_unit_cycle_index + 1) % idle_units.size()
	var unit = idle_units[_unit_cycle_index]

	# Center on the unit
	if unit.has("hex"):
		var center_pos = _hex_to_world(unit.hex) if typeof(unit.hex) == TYPE_VECTOR2I else Vector2(unit.hex.x, unit.hex.y)
		center_on(center_pos)

	# Emit selection signal so the UI updates
	EventBus.emit_unit_selected(StringName(str(unit.get("unit_id", unit.get("id", "")))))
	print_debug("[GameCamera] Centered on unit without orders: %s at hex %s" % [unit.get("unit_id", ""), unit.get("hex", "")))


## Convert a hex coordinate (Vector2i) to world position.
## Assumes hex tiles with a horizontal-layout spacing.
## Override this if the game uses a different hex-to-world mapping.
func _hex_to_world(hex: Vector2i) -> Vector2:
	# Standard offset-hex conversion for horizontal hex layout:
	# width = hex_size * sqrt(3), height = hex_size * 1.5
	# Default hex size of 64px
	var hex_size: float = 64.0
	var w: float = hex_size * sqrt(3.0)
	var h: float = hex_size * 1.5

	var x: float = float(hex.x) * w
	var y: float = float(hex.y) * h

	# Every odd row is offset by half-width
	if abs(hex.y) % 2 == 1:
		x += w * 0.5

	return Vector2(x, y)


## Clamp the given position so the camera's viewport fits within map bounds.
## Uses the camera's current zoom to compute the half-extents.
func _limit_position(pos: Vector2) -> Vector2:
	var viewport_size: Vector2 = get_viewport().get_visible_rect().size
	var half_extents = viewport_size * 0.5 * zoom

	var left = map_origin.x + half_extents.x
	var right = map_origin.x + map_size.x - half_extents.x
	var top = map_origin.y + half_extents.y
	var bottom = map_origin.y + map_size.y - half_extents.y

	# If the map is smaller than the viewport, center in the middle
	if left > right:
		var mid_x = map_origin.x + map_size.x * 0.5
		pos.x = mid_x
	else:
		pos.x = clampf(pos.x, left, right)

	if top > bottom:
		var mid_y = map_origin.y + map_size.y * 0.5
		pos.y = mid_y
	else:
		pos.y = clampf(pos.y, top, bottom)

	return pos