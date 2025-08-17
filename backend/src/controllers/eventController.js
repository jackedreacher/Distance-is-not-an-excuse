const Event = require('../models/Event');

// Get all events for the current user
exports.getEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const events = await Event.find({ user: userId }).populate('user', 'username');
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
};

// Create a new event
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, time, location } = req.body;
    const userId = req.user.id;

    // Create the event
    const event = new Event({
      title,
      description,
      date,
      time,
      location,
      user: userId
    });

    const savedEvent = await event.save();

    // Populate user info
    await savedEvent.populate('user', 'username');

    res.status(201).json(savedEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Failed to create event' });
  }
};

// Update an event
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, time, location } = req.body;
    const userId = req.user.id;

    // Find event
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user owns this event
    if (event.user.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Update event
    event.title = title || event.title;
    event.description = description || event.description;
    event.date = date || event.date;
    event.time = time || event.time;
    event.location = location || event.location;

    const updatedEvent = await event.save();

    // Populate user info
    await updatedEvent.populate('user', 'username');

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Failed to update event' });
  }
};

// Delete an event
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find event
    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user owns this event
    if (event.user.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete the event
    await Event.findByIdAndDelete(id);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
};