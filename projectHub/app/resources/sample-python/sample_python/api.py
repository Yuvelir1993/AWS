from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional

app = FastAPI()


class Item(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    in_stock: bool = True


@app.get("/", response_model=dict)
async def read_root():
    """
    Return a welcome message.

    :returns: A JSON response with a welcome message.
    :rtype: dict
    """
    return {"message": "Welcome to the FastAPI application!"}


@app.get("/items/{item_id}", response_model=Item)
async def read_item(item_id: int, q: Optional[str] = None):
    """
    Retrieve item details by ID.

    :param item_id: Unique identifier for the item.
    :type item_id: int
    :param q: Optional query string for filtering.
    :type q: Optional[str]
    :returns: A JSON response with item details.
    :rtype: Item
    :raises HTTPException: If the item is not found.
    """
    sample_item = {"name": "Sample Item",
                   "description": "A sample item for testing", "price": 10.0, "in_stock": True}
    if item_id == 1:
        return sample_item
    raise HTTPException(status_code=404, detail="Item not found")


@app.post("/items/", response_model=Item)
async def create_item(item: Item):
    """
    Create a new item.

    :param item: Item details.
    :type item: Item
    :returns: A JSON response with the created item.
    :rtype: Item
    """
    return item


@app.put("/items/{item_id}", response_model=Item)
async def update_item(item_id: int, item: Item):
    """
    Update an item by ID.

    :param item_id: Unique identifier for the item.
    :type item_id: int
    :param item: Updated item details.
    :type item: Item
    :returns: A JSON response with the updated item.
    :rtype: Item
    :raises HTTPException: If the item is not found.
    """
    if item_id == 1:
        return item
    raise HTTPException(status_code=404, detail="Item not found")


@app.delete("/items/{item_id}", response_model=dict)
async def delete_item(item_id: int):
    """
    Delete an item by ID.

    :param item_id: Unique identifier for the item.
    :type item_id: int
    :returns: A JSON response confirming deletion.
    :rtype: dict
    :raises HTTPException: If the item is not found.
    """
    if item_id == 1:
        return {"message": f"Item {item_id} deleted successfully"}
    raise HTTPException(status_code=404, detail="Item not found")
