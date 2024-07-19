const toolbar = plugin.CreateToolbar("MyToolbar");
const button = toolbar.CreateButton("MyButton", "", "");

button.Click.Connect(() => {
	print("Button clicked!");
});

const selection = game.GetService("Selection");

const allowed_types = ["GuiObject", "UIListLayout", "UIPadding"];

function ScaleUI() {
	const selected = selection.Get();
}

function ProcessObject(object: Instance) {
	const parent = object.Parent;
	if (parent === undefined) return;
	if (!parent.IsA("GuiBase2d")) return;
	const ui_paddings = parent
		.GetChildren()
		.filter((child) => child.IsA("UIPadding"));

	let offset = Vector2.zero;
	for (const padding of ui_paddings) {
		const scale_offset = new Vector2(
			padding.PaddingLeft.Scale + padding.PaddingRight.Scale,
			padding.PaddingTop.Scale + padding.PaddingBottom.Scale,
		);

		const pixel_offset = new Vector2(
			padding.PaddingLeft.Offset + padding.PaddingRight.Offset,
			padding.PaddingTop.Offset + padding.PaddingBottom.Offset,
		);

		offset = offset
			.add(scale_offset.mul(parent.AbsoluteSize))
			.add(pixel_offset);
	}

	let absolute_size = parent.AbsoluteSize.add(offset);
	absolute_size = new Vector2(
		math.max(absolute_size.X, 1),
		math.max(absolute_size.Y, 1),
	);
}
