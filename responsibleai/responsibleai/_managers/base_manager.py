# Copyright (c) Microsoft Corporation
# Licensed under the MIT License.

"""Defines the base class for managers."""

from abc import ABC, abstractmethod


def measure_time(manager_compute_func):
    def compute_wrapper(*args, **kwargs):
        separator(80)
        import timeit
        start_time = timeit.default_timer()
        manager_compute_func(*args, **kwargs)
        elapsed = timeit.default_timer() - start_time
        m, s = divmod(elapsed, 60)
        print('Time taken: {0} min {1} sec'.format(
              m, s))
        separator(80)
    return compute_wrapper


def separator(max_len):
    print('=' * max_len)


class BaseManager(ABC):
    """The base class for managers."""

    def __init__(self, *args, **kwargs):
        """Initialize the BaseManager."""
        super(BaseManager, self).__init__(*args, **kwargs)

    @abstractmethod
    def add(self):
        """Abstract method to add a computation to the manager."""

    @abstractmethod
    def compute(self):
        """Abstract method to compute the new work in the add method."""

    @abstractmethod
    def get(self):
        """Abstract method to get the computed results.

        :return: The computed results.
        :rtype: object
        """

    @abstractmethod
    def list(self):
        """Abstract method to list information about the manager.

        :return: A dictionary of properties.
        :rtype: dict
        """

    @property
    @abstractmethod
    def name(self):
        """Abstract property to get the name of the manager.

        :return: The name of the manager.
        :rtype: str
        """

    @abstractmethod
    def _save(self, path):
        """Abstract method to save the manager.

        :param path: The directory path to save the manager to.
        :type path: str
        """

    @staticmethod
    @abstractmethod
    def _load(path, model_analysis):
        """Static method to load the manager.

        :param path: The directory path to load the manager from.
        :type path: str
        :param model_analysis: The loaded parent ModelAnalysis.
        :type model_analysis: ModelAnalysis
        """
