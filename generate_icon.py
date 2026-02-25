from PIL import Image, ImageDraw
import math

size = 1024
# Transparent background
img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

cx = size // 2

# Draw Trunk
trunk_w = 120
trunk_h = 240
trunk_y = 700
draw.rectangle( [cx - trunk_w//2, trunk_y, cx + trunk_w//2, trunk_y + trunk_h], fill=(139, 90, 43, 255) )
draw.rectangle( [cx, trunk_y, cx + trunk_w//2, trunk_y + trunk_h], fill=(101, 67, 33, 255) )

# Function to draw a tree tier (triangle) with lighting
def draw_tier(y_top, y_bottom, width_half, color_left, color_right):
    draw.polygon([(cx, y_top), (cx, y_bottom), (cx - width_half, y_bottom)], fill=color_left)
    draw.polygon([(cx, y_top), (cx, y_bottom), (cx + width_half, y_bottom)], fill=color_right)

color_l3 = (75, 190, 125, 255)
color_r3 = (50, 150, 95, 255)

color_l2 = (60, 175, 110, 255)
color_r2 = (40, 135, 80, 255)

color_l1 = (45, 155, 90, 255)
color_r1 = (30, 115, 65, 255)

# Bottom tier
draw_tier(340, 780, 420, color_l1, color_r1)
# Middle tier
draw_tier(190, 580, 320, color_l2, color_r2)
# Top tier
draw_tier(80, 380, 220, color_l3, color_r3)

img.save('d:/antigravity/horiztree/app-icon.png')
